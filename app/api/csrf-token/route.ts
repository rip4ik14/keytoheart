// ✅ Путь: app/api/csrf-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ensureCsrfCookie(req: NextRequest, res: NextResponse) {
  let token = req.cookies.get('csrf_token')?.value;

  if (!token) {
    token = randomBytes(32).toString('hex');
    res.cookies.set('csrf_token', token, {
      httpOnly: false, // читаем на клиенте, чтобы прокинуть в header
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 день
    });
  }

  return token;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.json({ csrfToken: '' }, { status: 200 });

  const token = ensureCsrfCookie(req, res);

  return NextResponse.json(
    { csrfToken: token },
    {
      status: 200,
      headers: res.headers,
    }
  );
}
