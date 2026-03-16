// ✅ Путь: app/api/admin/update-order-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone } from '@/lib/normalizePhone';
import { safeBody } from '@/lib/api/safeBody';

const WELCOME_BONUS = 1000;

// Проценты кешбэка
const CASHBACK_LEVELS = [
  { level: 'bronze', percentage: 2.5, minTotal: 0 },
  { level: 'silver', percentage: 5, minTotal: 10000 },
  { level: 'gold', percentage: 7.5, minTotal: 20000 },
  { level: 'platinum', percentage: 10, minTotal: 30000 },
  { level: 'premium', percentage: 15, minTotal: 50000 },
] as const;

type LevelCode = (typeof CASHBACK_LEVELS)[number]['level'];

function decimalToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'object' && v && typeof v.toNumber === 'function') return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// UI (RU) -> DB (EN canonical)
function mapAdminStatusToDb(statusRu: string): 'pending' | 'processing' | 'delivered' | 'canceled' {
  switch (statusRu) {
    case 'Ожидает подтверждения':
      return 'pending';
    case 'В сборке':
      return 'processing';
    case 'Доставляется':
      return 'processing';
    case 'Доставлен':
      return 'delivered';
    case 'Отменён':
      return 'canceled';
    default:
      return 'pending';
  }
}

// Приводим уровень из базы (RU/EN/что угодно) к коду, чтобы проценты работали стабильно
function normalizeLevel(levelRaw: string | null | undefined): LevelCode {
  const v = (levelRaw || '').trim().toLowerCase();

  // если вдруг уже хранится по-английски
  if (v === 'bronze' || v === 'silver' || v === 'gold' || v === 'platinum' || v === 'premium') {
    return v as LevelCode;
  }

  // RU варианты (как в твоей таблице bonuses.level)
  if (v.includes('бронз')) return 'bronze';
  if (v.includes('сереб')) return 'silver';
  if (v.includes('золот')) return 'gold';
  if (v.includes('платин')) return 'platinum';
  if (v.includes('преми')) return 'premium';

  return 'bronze';
}

export async function POST(req: NextRequest) {
  try {
    const body = await safeBody<{ id?: string; status?: string }>(req, 'ADMIN UPDATE ORDER STATUS API');
    if (body instanceof NextResponse) return body;

    const id = body?.id;
    const status = body?.status;

    if (!id || typeof status !== 'string') {
      return NextResponse.json({ error: 'Invalid payload: id and status are required' }, { status: 400 });
    }

    // Проверка токена админки
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing admin session token' }, { status: 401 });
    }

    const isValidToken = await verifyAdminJwt(token);
    if (!isValidToken) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin session token' }, { status: 401 });
    }

    // Разрешаем RU статусы, которые реально есть в UI
    const validUiStatuses = ['Ожидает подтверждения', 'В сборке', 'Доставляется', 'Доставлен', 'Отменён'];
    if (!validUiStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const dbStatus = mapAdminStatusToDb(status);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id },
        select: { id: true, phone: true, total: true, bonus: true, status: true },
      });

      if (!order) {
        return { ok: false as const, code: 404, payload: { error: 'Order not found' } };
      }

      // Обновляем статус
      const updated = await tx.orders.update({
        where: { id },
        data: { status: dbStatus },
        select: { id: true, phone: true, total: true, bonus: true, status: true },
      });

      // Начисления делаем только при delivered и только если по этому заказу ещё не начисляли
      if (dbStatus !== 'delivered' || (updated.bonus ?? 0) !== 0) {
        return {
          ok: true as const,
          updated,
          bonusAccrual: 0,
          welcomeAccrual: 0,
          totalAccrual: 0,
          skipped: true as const,
        };
      }

      if (!updated.phone) {
        return { ok: false as const, code: 400, payload: { error: 'Order has no phone' } };
      }
      if (updated.total === null || updated.total === undefined) {
        return { ok: false as const, code: 400, payload: { error: 'Order has no total' } };
      }

      // Телефон -> +7XXXXXXXXXX
      const phone = normalizePhone(
        sanitizeHtml(String(updated.phone), { allowedTags: [], allowedAttributes: {} })
      );

      if (!/^\+7\d{10}$/.test(phone)) {
        return { ok: false as const, code: 400, payload: { error: 'Invalid phone format in order' } };
      }

      const totalAsNumber = Math.floor(decimalToNumber(updated.total));

      // Берём текущую запись бонусов (если нет - создадим)
      const existingBonus = await tx.bonuses.findUnique({
        where: { phone },
        select: { id: true, level: true, welcome_bonus_awarded_at: true },
      });

      const levelCode = normalizeLevel(existingBonus?.level);
      const levelObj = CASHBACK_LEVELS.find((lvl) => lvl.level === levelCode) || CASHBACK_LEVELS[0];

      const cashbackAccrual = Math.floor(totalAsNumber * (levelObj.percentage / 100));

      // Приветственные - только один раз
      const welcomeAccrual = existingBonus?.welcome_bonus_awarded_at ? 0 : WELCOME_BONUS;

      const totalAccrual = cashbackAccrual + welcomeAccrual;

      // Обновляем/создаём bonuses
      const upserted = await tx.bonuses.upsert({
        where: { phone },
        update: {
          bonus_balance: { increment: totalAccrual },
          total_spent: { increment: totalAsNumber },
          total_bonus: { increment: totalAccrual },
          updated_at: new Date(),
          ...(welcomeAccrual > 0 ? { welcome_bonus_awarded_at: new Date() } : {}),
        },
        create: {
          phone,
          bonus_balance: totalAccrual,
          level: 'Бронзовый', // твой текущий стандарт в базе
          total_spent: totalAsNumber,
          total_bonus: totalAccrual,
          updated_at: new Date(),
          welcome_bonus_awarded_at: welcomeAccrual > 0 ? new Date() : null,
        },
        select: { id: true },
      });

      // История бонусов - НЕ пишем user_id (иначе FK в auth.users)
      if (welcomeAccrual > 0) {
        await tx.bonus_history.create({
          data: {
            bonus_id: upserted.id,
            phone,
            amount: welcomeAccrual,
            reason: `Приветственные бонусы за первый доставленный заказ #${id}`,
            created_at: new Date(),
          },
        });
      }

      if (cashbackAccrual > 0) {
        await tx.bonus_history.create({
          data: {
            bonus_id: upserted.id,
            phone,
            amount: cashbackAccrual,
            reason: `Кешбэк за доставленный заказ #${id}`,
            created_at: new Date(),
          },
        });
      }

      // Фиксируем в заказе сумму начисления, чтобы не начислить повторно по этому заказу
      const updatedOrder = await tx.orders.update({
        where: { id },
        data: { bonus: totalAccrual },
        select: { id: true, phone: true, total: true, bonus: true, status: true },
      });

      return {
        ok: true as const,
        updated: updatedOrder,
        bonusAccrual: cashbackAccrual,
        welcomeAccrual,
        totalAccrual,
        skipped: false as const,
      };
    });

    if (!result.ok) {
      return NextResponse.json(result.payload, { status: result.code });
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      status_db: (result as any).updated?.status,
      bonusAccrual: (result as any).bonusAccrual ?? 0,
      welcomeAccrual: (result as any).welcomeAccrual ?? 0,
      totalAccrual: (result as any).totalAccrual ?? 0,
      skipped: (result as any).skipped ?? true,
    });
  } catch (err: any) {
    process.env.NODE_ENV !== 'production' && console.error('Error updating order status:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
