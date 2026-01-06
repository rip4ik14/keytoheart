import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_COOKIE = 'csrf_token';

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function jsonNoStore(data: any) {
  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

function setCsrfCookie(res: NextResponse, token: string) {
  // HttpOnly: false, чтобы фронт мог прочитать токен и отправить в x-csrf-token
  res.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
  });
}

export async function GET(_req: NextRequest) {
  const token = createToken();
  const res = jsonNoStore({ csrfToken: token });
  setCsrfCookie(res, token);
  return res;
}

// POST сделаем алиасом на GET (чтобы твои проверки curl-ом работали)
export async function POST(_req: NextRequest) {
  const token = createToken();
  const res = jsonNoStore({ csrfToken: token });
  setCsrfCookie(res, token);
  return res;
}
