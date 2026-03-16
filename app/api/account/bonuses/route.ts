import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPhoneVariants } from '@/lib/normalizePhone';
import { requireAuthPhone } from '@/lib/api/requireAuthPhone';

const log = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') console.log('[account/bonuses]', ...args);
};

export async function GET() {
  try {
    const auth = await requireAuthPhone();
    if (!auth.ok) return auth.response;

    const { phone } = auth;
    const variants = buildPhoneVariants(phone);
    const phoneWhere = { OR: variants.map((p) => ({ phone: p })) };

    const bonuses = await prisma.bonuses.findFirst({
      where: phoneWhere,
      orderBy: [{ bonus_balance: 'desc' }, { updated_at: 'desc' }],
      select: { id: true, bonus_balance: true, level: true },
    });

    const data = bonuses
      ? {
          id: bonuses.id,
          phone,
          bonus_balance: bonuses.bonus_balance ?? 0,
          level: bonuses.level ?? 'bronze',
        }
      : { id: null, phone, bonus_balance: 0, level: 'bronze' };

    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }
    process.env.NODE_ENV !== 'production' && console.error('[account/bonuses GET]', e);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const auth = await requireAuthPhone();
    if (!auth.ok) return auth.response;

    const { phone } = auth;
    const variants = buildPhoneVariants(phone);
    const phoneWhere = { OR: variants.map((p) => ({ phone: p })) };

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await prisma.$transaction(async (tx) => {
      const bonusMain = await tx.bonuses.findFirst({
        where: phoneWhere,
        orderBy: [{ bonus_balance: 'desc' }, { updated_at: 'desc' }],
        select: { id: true, bonus_balance: true },
      });

      if (!bonusMain) return { expired: 0 };

      const recentActivity = await tx.bonus_history.findFirst({
        where: { bonus_id: bonusMain.id, created_at: { gte: sixMonthsAgo } },
        select: { id: true },
      });
      if (recentActivity) return { expired: 0 };

      const lastOrder = await tx.orders.findFirst({
        where: phoneWhere,
        orderBy: { created_at: 'desc' },
        select: { created_at: true },
      });

      if (!lastOrder?.created_at) return { expired: 0 };

      const lastOrderDate = new Date(lastOrder.created_at);
      if (lastOrderDate >= sixMonthsAgo) return { expired: 0 };

      const currentBalance = Number(bonusMain.bonus_balance ?? 0);
      if (!currentBalance || currentBalance <= 0) return { expired: 0 };

      await tx.bonuses.updateMany({
        where: phoneWhere,
        data: { bonus_balance: 0, updated_at: new Date() },
      });

      await tx.bonus_history.create({
        data: {
          bonus_id: bonusMain.id,
          amount: -currentBalance,
          reason: 'Сгорание бонусов за неактивность (6 месяцев)',
          created_at: new Date(),
        },
      });

      log(`Expired ${currentBalance} for`, phone);
      return { expired: currentBalance };
    });

    return NextResponse.json({ success: true, expired: result.expired });
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }
    process.env.NODE_ENV !== 'production' && console.error('[account/bonuses POST]', e);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
