// ✅ Путь: app/api/promo/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    process.env.NODE_ENV !== "production" && console.log('POST /api/promo/validate: Starting request');
    const body = await req.json();
    process.env.NODE_ENV !== "production" && console.log('POST /api/promo/validate: Received payload:', body);

    const { code } = body;
    if (!code) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/promo/validate: Missing code');
      return NextResponse.json({ error: 'Код промокода обязателен' }, { status: 400 });
    }

    process.env.NODE_ENV !== "production" && console.log('POST /api/promo/validate: Validating promo code:', code);
    const promo = await prisma.promo_codes.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        discount_value: true, // Исправлено: используем discount_value вместо discount
        discount_type: true,
        is_active: true,
        expires_at: true,
        max_uses: true,
        used_count: true,
      },
    });

    if (!promo || !promo.is_active) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/promo/validate: Promo code invalid or inactive:', code);
      return NextResponse.json({ error: 'Промокод недействителен' }, { status: 400 });
    }

    const now = new Date();
    if (promo.expires_at && promo.expires_at < now) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/promo/validate: Promo code expired:', code, 'Expires at:', promo.expires_at);
      return NextResponse.json({ error: 'Срок действия промокода истёк' }, { status: 400 });
    }

    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/promo/validate: Promo code usage limit reached:', code);
      return NextResponse.json({ error: 'Промокод исчерпан' }, { status: 400 });
    }

    process.env.NODE_ENV !== "production" && console.log('POST /api/promo/validate: Promo code validated:', promo);
    return NextResponse.json({
      success: true,
      discount: promo.discount_value, // Исправлено: возвращаем discount_value
      discountType: promo.discount_type,
      promoId: promo.id,
    });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('POST /api/promo/validate: Error:', error);
    return NextResponse.json(
      { error: 'Ошибка проверки промокода: ' + error.message },
      { status: 500 }
    );
  }
}