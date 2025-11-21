// ✅ Путь: app/api/promo-codes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// Генерация (или возврат существующего) CSRF-токена
function ensureCsrfCookie(req: NextRequest, res: NextResponse) {
  let token = req.cookies.get('csrf_token')?.value;

  if (!token) {
    token = randomBytes(32).toString('hex');
    res.cookies.set('csrf_token', token, {
      httpOnly: false, // нужно, чтобы фронт мог прочитать и положить в X-CSRF-Token
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // сутки
    });
  }

  return token;
}

function checkCSRF(req: NextRequest) {
  const headerToken = req.headers.get('x-csrf-token');
  const cookieToken = req.cookies.get('csrf_token')?.value;

  if (headerToken && cookieToken && headerToken === cookieToken) {
    return true;
  }

  return false;
}

// ──────────────────────────────────────────────────────────────────────────────
// GET: список промокодов + установка CSRF-куки, если её нет
// ──────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const codes = await prisma.promo_codes.findMany({
      select: {
        id: true,
        code: true,
        discount_value: true,
        discount_type: true,
        expires_at: true,
        is_active: true,
      },
      orderBy: { id: 'desc' },
    });

    const res = NextResponse.json(codes);
    // важно: гарантируем, что у клиента есть csrf_token
    ensureCsrfCookie(req, res);

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST: создание промокода
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!checkCSRF(req)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  try {
    const { code, discount_value, discount_type, expires_at, is_active } =
      await req.json();

    const promo = await prisma.promo_codes.create({
      data: { code, discount_value, discount_type, expires_at, is_active },
    });

    return NextResponse.json(promo);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PATCH: обновление промокода
// ──────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!checkCSRF(req)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  try {
    const { id, code, discount_value, discount_type, expires_at, is_active } =
      await req.json();

    const promo = await prisma.promo_codes.update({
      where: { id },
      data: { code, discount_value, discount_type, expires_at, is_active },
    });

    return NextResponse.json(promo);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// DELETE: можно оставить без CSRF, но при желании добавить ту же проверку
// ──────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.promo_codes.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
