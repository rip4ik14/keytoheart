import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      process.env.NODE_ENV !== "production" && console.error(`[${new Date().toISOString()}] Invalid phone format: ${phone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }

    const bonuses = await prisma.bonuses.findUnique({
      where: { phone },
      select: { bonus_balance: true, level: true },
    });

    process.env.NODE_ENV !== "production" && console.log(`[${new Date().toISOString()}] Bonuses check result:`, bonuses);

    if (!bonuses) {
      return NextResponse.json(
        { success: false, error: 'Бонусы не найдены для указанного телефона' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bonus_balance: bonuses.bonus_balance ?? 0,
      level: bonuses.level ?? 'basic',
    });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error(`[${new Date().toISOString()}] Server error in checkbonuses:`, error.message);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
