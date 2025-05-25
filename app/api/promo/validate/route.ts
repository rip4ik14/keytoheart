import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code } = body;
  if (!code) {
    return NextResponse.json({ error: 'Код промокода обязателен' }, { status: 400 });
  }

  const promo = await prisma.promo_codes.findUnique({
    where: { code },
    select: {
      id: true,
      discount: true,
      discount_type: true,
      is_active: true,
      expires_at: true,
      max_uses: true,
      used_count: true,
    },
  });

  if (!promo || !promo.is_active) {
    return NextResponse.json({ error: 'Промокод недействителен' }, { status: 400 });
  }

  const now = new Date();
  if (promo.expires_at && promo.expires_at < now) {
    return NextResponse.json({ error: 'Срок действия промокода истёк' }, { status: 400 });
  }

  if (promo.max_uses && promo.used_count >= promo.max_uses) {
    return NextResponse.json({ error: 'Промокод исчерпан' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    discount: promo.discount,
    discountType: promo.discount_type,
    promoId: promo.id,
  });
}
