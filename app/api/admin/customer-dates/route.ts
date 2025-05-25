import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, reason, user_id } = await req.json();
    if (!phone || typeof amount !== 'number' || !reason || !user_id)
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });

    const bonuses = await prisma.bonuses.findUnique({ where: { phone } });
    if (!bonuses) return NextResponse.json({ error: 'Бонусный счет не найден' }, { status: 404 });

    const newBalance = (bonuses.bonus_balance ?? 0) + amount;
    if (newBalance < 0) return NextResponse.json({ error: 'Недостаточно бонусов' }, { status: 400 });

    await prisma.bonuses.update({ where: { phone }, data: { bonus_balance: newBalance } });

    await prisma.bonus_history.create({
      data: {
        user_id,
        bonus_id: bonuses.id, // <-- Привязываем к бонусному счету
        amount,
        reason,
        created_at: new Date()
      }
    });

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
