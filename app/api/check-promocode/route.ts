import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeBody } from '@/lib/api/safeBody';
import { requireCsrf } from '@/lib/api/csrf';

export async function POST(req: NextRequest) {
  const csrfError = requireCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  const body = await safeBody<{ code?: string }>(req, 'CHECK PROMOCODE API');
  if (body instanceof NextResponse) {
    return body;
  }
  const { code } = body;

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
