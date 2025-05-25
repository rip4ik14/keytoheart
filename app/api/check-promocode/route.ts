import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ valid: false, message: 'Код промокода обязателен' }, { status: 400 });
  }

  const promo = await prisma.promo_codes.findFirst({
    where: {
      code: code.trim().toUpperCase(),
    },
    select: {
      id: true,
      discount: true,
      is_active: true,
      expires_at: true,
      max_uses: true,
      used_count: true,
    },
  });

  if (!promo) {
    return NextResponse.json({ valid: false, message: 'Промокод не найден' }, { status: 400 });
  }

  const now = new Date();

  if (!promo.is_active) {
    return NextResponse.json({ valid: false, message: 'Промокод отключён' }, { status: 400 });
  }

  if (promo.expires_at && promo.expires_at < now) {
    return NextResponse.json({ valid: false, message: 'Срок действия истёк' }, { status: 400 });
  }

  if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
    return NextResponse.json({ valid: false, message: 'Лимит использований исчерпан' }, { status: 400 });
  }

  return NextResponse.json({ valid: true, discount: promo.discount });
}
