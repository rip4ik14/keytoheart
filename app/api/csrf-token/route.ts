import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const COOKIE_NAME = 'csrf_token';

function issueToken() {
  return randomBytes(32).toString('hex');
}

export async function GET(req: NextRequest) {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  const token = existing || issueToken();

  const res = NextResponse.json({ csrfToken: token }, { status: 200 });

  // Всегда гарантируем, что cookie существует и совпадает с тем, что вернули
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: false, // токен нужен фронту
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 день
  });

  return res;
}
