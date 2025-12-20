// ✅ Путь: app/api/promo-codes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';

// Генерация (или возврат существующего) CSRF-токена
function ensureCsrfCookie(req: NextRequest, res: NextResponse) {
  let token = req.cookies.get('csrf_token')?.value;

  if (!token) {
    token = randomBytes(32).toString('hex');
    res.cookies.set('csrf_token', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
  }

  return token;
}

function checkCSRF(req: NextRequest) {
  const headerToken = req.headers.get('x-csrf-token');
  const cookieToken = req.cookies.get('csrf_token')?.value;
  return Boolean(headerToken && cookieToken && headerToken === cookieToken);
}

function normalizeCode(input: unknown) {
  const code = String(input ?? '').trim().toUpperCase();

  if (!code) throw new Error('Код обязателен');
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    throw new Error('Код должен содержать только буквы, цифры, дефис или подчёркивание');
  }

  return code;
}

function parseExpiresAt(input: unknown) {
  if (input === null || input === undefined || input === '') return null;

  const d = new Date(String(input));
  if (Number.isNaN(d.getTime())) throw new Error('Некорректная дата истечения');

  if (d.getTime() < Date.now()) {
    throw new Error('Дата истечения должна быть в будущем');
  }

  return d;
}

function parseDiscountType(input: unknown): 'percentage' | 'fixed' {
  const v = String(input ?? 'percentage');
  if (v !== 'percentage' && v !== 'fixed') return 'percentage';
  return v;
}

function parseIsActive(input: unknown) {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') return input === 'true';
  return true;
}

function parseDiscountValue(input: unknown) {
  const n = Number(input);
  if (!Number.isFinite(n)) throw new Error('Некорректное значение скидки');
  if (n <= 0) throw new Error('Скидка должна быть больше 0');
  return Math.trunc(n);
}

function prismaErrorToMessage(err: any) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return 'Такой промокод уже существует';
    if (err.code === 'P2025') return 'Промокод не найден (возможно уже удалён)';
  }
  return err?.message || 'Ошибка сервера';
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
      orderBy: { created_at: 'desc' },
    });

    const res = NextResponse.json(codes, { status: 200 });
    ensureCsrfCookie(req, res);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: prismaErrorToMessage(err) }, { status: 500 });
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
    const body = await req.json();

    const code = normalizeCode(body.code);
    const discount_value = parseDiscountValue(body.discount_value);
    const discount_type = parseDiscountType(body.discount_type);
    const expires_at = parseExpiresAt(body.expires_at);
    const is_active = parseIsActive(body.is_active);

    const promo = await prisma.promo_codes.create({
      data: { code, discount_value, discount_type, expires_at, is_active },
      select: {
        id: true,
        code: true,
        discount_value: true,
        discount_type: true,
        expires_at: true,
        is_active: true,
      },
    });

    return NextResponse.json(promo, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: prismaErrorToMessage(err) }, { status: 400 });
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
    const body = await req.json();

    const id = String(body.id ?? '').trim();
    if (!id) return NextResponse.json({ error: 'Не передан id' }, { status: 400 });

    const code = normalizeCode(body.code);
    const discount_value = parseDiscountValue(body.discount_value);
    const discount_type = parseDiscountType(body.discount_type);
    const expires_at = parseExpiresAt(body.expires_at);
    const is_active = parseIsActive(body.is_active);

    const promo = await prisma.promo_codes.update({
      where: { id },
      data: { code, discount_value, discount_type, expires_at, is_active },
      select: {
        id: true,
        code: true,
        discount_value: true,
        discount_type: true,
        expires_at: true,
        is_active: true,
      },
    });

    return NextResponse.json(promo, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: prismaErrorToMessage(err) }, { status: 400 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// DELETE: удаление промокода
// - принимает id из body или из query ?id=
// - fallback: удаление по code (на случай если на клиенте случайно отправили code)
// ──────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!checkCSRF(req)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const idFromQuery = url.searchParams.get('id')?.trim() || '';
    const codeFromQuery = url.searchParams.get('code')?.trim() || '';

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const id = String(body.id ?? idFromQuery ?? '').trim();
    const code = String(body.code ?? codeFromQuery ?? '').trim().toUpperCase();

    if (!id && !code) {
      return NextResponse.json({ error: 'Не передан id или code' }, { status: 400 });
    }

    const result = await prisma.promo_codes.deleteMany({
      where: id ? { id } : { code },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Промокод не найден (возможно уже удалён)' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: prismaErrorToMessage(err) }, { status: 400 });
  }
}
