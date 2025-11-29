// ✅ Путь: app/api/bonuses/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone, buildPhoneVariants } from '@/lib/normalizePhone';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneParam = searchParams.get('phone') || '';
    const sanitizedPhone = sanitizeHtml(phoneParam, {
      allowedTags: [],
      allowedAttributes: {},
    });

    const normalizedPhone = normalizePhone(sanitizedPhone);
    const variants = buildPhoneVariants(normalizedPhone);

    if (!variants.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Некорректный формат номера (должно быть не менее 10 цифр)',
        },
        { status: 400 },
      );
    }

    const phoneWhere = {
      OR: variants.map((p: string) => ({ phone: p })),
    };

    // 🔥 так же как в /account/bonuses – берём максимальный баланс
    const bonuses = await prisma.bonuses.findFirst({
      where: phoneWhere,
      orderBy: {
        bonus_balance: 'desc',
      },
      select: {
        id: true,
        bonus_balance: true,
        level: true,
      },
    });

    const data = bonuses
      ? {
          id: bonuses.id,
          bonus_balance: bonuses.bonus_balance ?? 0,
          level: bonuses.level ?? 'bronze',
        }
      : {
          id: null,
          bonus_balance: 0,
          level: 'bronze',
        };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error('API /bonuses error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 },
    );
  }
}
