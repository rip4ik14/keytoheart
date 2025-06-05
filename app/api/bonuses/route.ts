// app/api/bonuses/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone') || '';
    const sanitizedPhone = sanitizeHtml(phone, { allowedTags: [], allowedAttributes: {} });

    if (!/^\+7\d{10}$/.test(sanitizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    const bonuses = await prisma.bonuses.findUnique({
      where: { phone: sanitizedPhone },
      select: { id: true, bonus_balance: true, level: true },
    });

    const data = bonuses
      ? { id: bonuses.id, bonus_balance: bonuses.bonus_balance ?? 0, level: bonuses.level ?? 'bronze' }
      : { id: null, bonus_balance: 0, level: 'bronze' };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('API /bonuses error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
