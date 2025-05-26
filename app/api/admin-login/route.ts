import { NextRequest, NextResponse } from 'next/server';
import { signAdminJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'NEAUTH', message: 'Неверный пароль' }, { status: 401 });
  }

  const token = signAdminJwt();
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.keytoheart.ru' : undefined,
    maxAge: 60 * 60 * 8,
  });

  return res;
}
