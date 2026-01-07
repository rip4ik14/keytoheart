import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const COOKIE_NAME = 'csrf_token';

function issueToken() {
  return randomBytes(32).toString('hex');
}

export async function GET(req: NextRequest) {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  const token = existing || issueToken();

  const res = NextResponse.json({ token }, { status: 200 });
  res.headers.set('Cache-Control', 'no-store');

  if (!existing) {
    // Устанавливаем cookie только при отсутствии текущего токена
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: false, // токен нужен фронту
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      domain: '.keytoheart.ru',
      maxAge: 60 * 60 * 24, // 1 день
    });
  }

  return res;
}
