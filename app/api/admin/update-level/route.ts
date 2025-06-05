import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'No session token provided' },
        { status: 401 }
      );
    }

    const isValidToken = await verifyAdminJwt(token);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { phone, level } = body;

    if (!phone || !level) {
      return NextResponse.json(
        { error: 'Phone and level are required' },
        { status: 400 }
      );
    }

    // Проверяем допустимые уровни
    const validLevels = ['bronze', 'silver', 'gold', 'platinum', 'premium'];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: 'Invalid level value' },
        { status: 400 }
      );
    }

    // Обновляем уровень клиента в таблице bonuses
    const updatedBonus = await prisma.bonuses.update({
      where: { phone },
      data: { level },
      select: { level: true },
    });

    return NextResponse.json({ success: true, level: updatedBonus.level });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error updating customer level:', error);
    return NextResponse.json(
      { error: 'Failed to update customer level: ' + error.message },
      { status: 500 }
    );
  }
}