// ✅ Путь: app/api/orders/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeBody } from '@/lib/api/safeBody';
import sanitizeHtml from 'sanitize-html';
import { requireCsrf } from '@/lib/api/csrf';

const CASHBACK_LEVELS = [
  { level: 'bronze', percentage: 2.5, minTotal: 0 },
  { level: 'silver', percentage: 5, minTotal: 10000 },
  { level: 'gold', percentage: 7.5, minTotal: 20000 },
  { level: 'platinum', percentage: 10, minTotal: 30000 },
  { level: 'premium', percentage: 15, minTotal: 50000 },
];

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+7' + digits;
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '+7' + digits.slice(-10);
  }
  return raw.startsWith('+') ? raw : '+' + raw;
}

function decimalToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'object' && v && typeof v.toNumber === 'function') return v.toNumber();
  return Number(v);
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = requireCsrf(req);
    if (csrfError) {
      return csrfError;
    }

    const body = await safeBody<{ orderId?: string; status?: string }>(
      req,
      'ORDERS UPDATE STATUS API',
    );
    if (body instanceof NextResponse) {
      return body;
    }
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Не указаны orderId или status' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) Обновляем статус и забираем данные заказа
      const order = await tx.orders.update({
        where: { id: orderId },
        data: { status },
        select: {
          id: true,
          phone: true,
          total: true,
          bonus: true,
          status: true,
        },
      });

      // Начисляем только если delivered и ещё не начисляли
      if (status !== 'delivered' || order.bonus !== 0) {
        return { order, bonusAccrual: 0, skipped: true as const };
      }

      if (!order.phone) {
        throw new Error('Телефон заказа не указан');
      }
      if (order.total === null) {
        throw new Error('Сумма заказа не указана');
      }

      const phone = normalizePhone(
        sanitizeHtml(order.phone, { allowedTags: [], allowedAttributes: {} })
      );

      // Если хочешь строго - раскомментируй
      // if (!/^\+7\d{10}$/.test(phone)) {
      //   throw new Error('Некорректный формат номера телефона');
      // }

      const totalAsNumber = decimalToNumber(order.total);

      // 2) Получаем текущий уровень
      const bonusRecord = await tx.bonuses.findUnique({
        where: { phone },
        select: { id: true, level: true },
      });

      const currentLevel = bonusRecord?.level ?? 'bronze';
      const levelObj = CASHBACK_LEVELS.find((lvl) => lvl.level === currentLevel) || CASHBACK_LEVELS[0];
      const bonusAccrual = Math.floor(totalAsNumber * (levelObj.percentage / 100));

      // 3) Upsert бонусов (без nested create)
      const upserted = await tx.bonuses.upsert({
        where: { phone },
        update: {
          bonus_balance: { increment: bonusAccrual },
          total_spent: { increment: totalAsNumber },
          total_bonus: { increment: bonusAccrual },
          updated_at: new Date(),
        },
        create: {
          phone,
          bonus_balance: bonusAccrual,
          level: 'bronze',
          total_spent: totalAsNumber,
          total_bonus: bonusAccrual,
          updated_at: new Date(),
        },
        select: { id: true },
      });

      // 4) История отдельно, явная привязка к bonuses.id
      await tx.bonus_history.create({
        data: {
          bonus_id: upserted.id,
          phone,
          amount: bonusAccrual, // Prisma сам приведёт number -> Decimal
          reason: `Начисление за заказ #${orderId}`,
          created_at: new Date(),
        },
      });

      // 5) Проставляем в заказ, сколько начислили (защита от повторного начисления)
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: { bonus: bonusAccrual },
        select: {
          id: true,
          phone: true,
          total: true,
          bonus: true,
          status: true,
        },
      });

      return { order: updatedOrder, bonusAccrual, skipped: false as const };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Ошибка сервера: ' + error.message }, { status: 500 });
  }
}
