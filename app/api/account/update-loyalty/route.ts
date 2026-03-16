import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPhoneVariants } from '@/lib/normalizePhone';
import { requireAuthPhone } from '@/lib/api/requireAuthPhone';

export async function POST() {
  try {
    const auth = await requireAuthPhone();
    if (!auth.ok) return auth.response;

    const { phone } = auth;
    const variants = buildPhoneVariants(phone);

    const deliveredOrders = await prisma.orders.findMany({
      where: {
        status: 'delivered',
        OR: variants.map((p) => ({ phone: p })),
      },
      select: { total: true },
    });

    const totalSpent =
      deliveredOrders.reduce((sum: number, order: any) => {
        const v = order?.total != null ? Number(order.total) : 0;
        return sum + (Number.isFinite(v) ? v : 0);
      }, 0) || 0;

    let level: string;
    if (totalSpent >= 50000) level = 'premium';
    else if (totalSpent >= 30000) level = 'platinum';
    else if (totalSpent >= 20000) level = 'gold';
    else if (totalSpent >= 10000) level = 'silver';
    else level = 'bronze';

    const updated = await prisma.bonuses.updateMany({
      where: { OR: variants.map((p) => ({ phone: p })) },
      data: {
        level,
        total_spent: totalSpent,
        updated_at: new Date(),
      },
    });

    if (updated.count === 0) {
      await prisma.bonuses.create({
        data: {
          phone,
          level,
          total_spent: totalSpent,
          bonus_balance: 0,
          updated_at: new Date(),
        } as any,
      });
    }

    return NextResponse.json({ success: true, level, total_spent: totalSpent });
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }
    process.env.NODE_ENV !== 'production' && console.error('[update-loyalty]', e);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
