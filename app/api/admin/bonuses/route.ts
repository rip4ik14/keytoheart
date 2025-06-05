import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      process.env.NODE_ENV !== "production" && console.log('No session token provided');
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 401 }
      );
    }

    const isValidToken = await verifyAdminJwt(token);
    if (!isValidToken) {
      process.env.NODE_ENV !== "production" && console.log('Invalid session token');
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    const body = await req.json();
    process.env.NODE_ENV !== "production" && console.log('Received bonus update request body:', body);

    const { phone, delta, reason, user_id } = body;

    if (!phone || !delta || !reason || !user_id) {
      process.env.NODE_ENV !== "production" && console.log('Missing required fields:', { phone, delta, reason, user_id });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли запись в bonuses
    let currentBonus = await prisma.bonuses.findUnique({
      where: { phone },
      select: { bonus_balance: true },
    });

    if (!currentBonus) {
      process.env.NODE_ENV !== "production" && console.log(`Bonuses not found for phone: ${phone}, creating new record`);
      await prisma.bonuses.create({
        data: {
          phone,
          bonus_balance: 0,
          level: 'bronze',
          updated_at: new Date(),
        },
      });
      currentBonus = { bonus_balance: 0 };
    }

    const newBal = (currentBonus.bonus_balance || 0) + delta;
    if (newBal < 0) {
      process.env.NODE_ENV !== "production" && console.log('Balance cannot be negative:', newBal);
      return NextResponse.json(
        { error: 'Balance cannot be negative' },
        { status: 400 }
      );
    }

    // Обновляем баланс
    await prisma.bonuses.update({
      where: { phone },
      data: { bonus_balance: newBal, updated_at: new Date() },
    });

    // Добавляем запись в историю бонусов
    await prisma.bonus_history.create({
      data: {
        user_id,
        amount: delta,
        reason,
        created_at: new Date(),
      },
    });

    process.env.NODE_ENV !== "production" && console.log(`Successfully updated bonuses for phone: ${phone}, new balance: ${newBal}`);
    return NextResponse.json({ success: true, newBalance: newBal });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error updating bonuses:', error);
    return NextResponse.json(
      { error: 'Failed to update bonuses: ' + error.message },
      { status: 500 }
    );
  }
}