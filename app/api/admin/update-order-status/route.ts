// ✅ Путь: app/api/admin/update-order-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone } from '@/lib/normalizePhone';

const CASHBACK_LEVELS = [
  { level: 'bronze', percentage: 2.5, minTotal: 0 },
  { level: 'silver', percentage: 5, minTotal: 10000 },
  { level: 'gold', percentage: 7.5, minTotal: 20000 },
  { level: 'platinum', percentage: 10, minTotal: 30000 },
  { level: 'premium', percentage: 15, minTotal: 50000 },
];

function decimalToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'object' && v && typeof v.toNumber === 'function') return v.toNumber();
  return Number(v);
}

function mapAdminStatusToDb(statusRu: string): string {
  // ВАЖНО: храним в БД единый набор (англ), а в UI показываем русские
  switch (statusRu) {
    case 'Ожидает подтверждения':
      return 'pending';
    case 'В сборке':
      return 'assembling';
    case 'Доставляется':
      return 'shipping';
    case 'Доставлен':
      return 'delivered';
    case 'Отменён':
      return 'canceled';
    default:
      return 'pending';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload: id and status are required' },
        { status: 400 }
      );
    }

    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing admin session token' },
        { status: 401 }
      );
    }

    const isValidToken = await verifyAdminJwt(token);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin session token' },
        { status: 401 }
      );
    }

    const validStatuses = [
      'Ожидает подтверждения',
      'В сборке',
      'Доставляется',
      'Доставлен',
      'Отменён',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const dbStatus = mapAdminStatusToDb(status);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id },
        select: { id: true, phone: true, total: true, bonus: true, status: true, user_id: true },
      });

      if (!order) {
        return { ok: false as const, code: 404, payload: { error: 'Order not found' } };
      }

      // Обновляем статус в БД (внутренний)
      const updated = await tx.orders.update({
        where: { id },
        data: { status: dbStatus },
        select: { id: true, phone: true, total: true, bonus: true, status: true, user_id: true },
      });

      // Начисляем только если delivered и ещё не начисляли (bonus == 0)
      if (dbStatus !== 'delivered' || updated.bonus !== 0) {
        return { ok: true as const, updated, bonusAccrual: 0, skipped: true as const };
      }

      if (!updated.phone) {
        return { ok: false as const, code: 400, payload: { error: 'Order has no phone' } };
      }
      if (updated.total === null) {
        return { ok: false as const, code: 400, payload: { error: 'Order has no total' } };
      }

      const phone = normalizePhone(
        sanitizeHtml(updated.phone, { allowedTags: [], allowedAttributes: {} })
      );

      if (!/^\+7\d{10}$/.test(phone)) {
        return { ok: false as const, code: 400, payload: { error: 'Invalid phone format in order' } };
      }

      const totalAsNumber = decimalToNumber(updated.total);

      const bonusRecord = await tx.bonuses.findUnique({
        where: { phone },
        select: { id: true, level: true },
      });

      const currentLevel = bonusRecord?.level ?? 'bronze';
      const levelObj =
        CASHBACK_LEVELS.find((lvl) => lvl.level === currentLevel) || CASHBACK_LEVELS[0];

      const bonusAccrual = Math.floor(totalAsNumber * (levelObj.percentage / 100));

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

      await tx.bonus_history.create({
        data: {
          bonus_id: upserted.id,
          phone,
          amount: bonusAccrual,
          reason: `Начисление за заказ #${id}`,
          created_at: new Date(),
          user_id: updated.user_id,
        },
      });

      const updatedOrder = await tx.orders.update({
        where: { id },
        data: { bonus: bonusAccrual },
        select: { id: true, phone: true, total: true, bonus: true, status: true },
      });

      return { ok: true as const, updated: updatedOrder, bonusAccrual, skipped: false as const };
    });

    if (!result.ok) {
      return NextResponse.json(result.payload, { status: result.code });
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      status_db: (result as any).updated?.status,
      bonusAccrual: (result as any).bonusAccrual ?? 0,
      skipped: (result as any).skipped ?? true,
    });
  } catch (err: any) {
    process.env.NODE_ENV !== 'production' && console.error('Error updating order status:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
