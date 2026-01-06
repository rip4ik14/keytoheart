import { NextRequest, NextResponse } from 'next/server';
import { signAdminJwt } from '@/lib/auth';
import { safeJson } from '@/lib/api/safeJson';

export async function POST(req: NextRequest) {
  const parsed = await safeJson(req, 'ADMIN LOGIN API');
  if (!parsed.ok) return parsed.response;
  const { password } = parsed.data as { password?: string };

  process.env.NODE_ENV !== "production" &&
    console.log(`${new Date().toISOString()} /api/admin-login: Received request`, { password });

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    process.env.NODE_ENV !== "production" &&
      console.warn(`${new Date().toISOString()} /api/admin-login: Invalid password`, {
        expected: process.env.ADMIN_PASSWORD,
      received: password,
    });
    return NextResponse.json({ error: 'NEAUTH', message: 'Неверный пароль' }, { status: 401 });
  }

  try {
    const token = await signAdminJwt();
    process.env.NODE_ENV !== "production" &&
      console.log(`${new Date().toISOString()} /api/admin-login: JWT generated`, { token });
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    process.env.NODE_ENV !== "production" &&
      console.log(`${new Date().toISOString()} /api/admin-login: Cookie admin_session set`, {
        cookie: res.cookies.get('admin_session'),
      setCookieHeader: res.headers.get('set-cookie'),
      nodeEnv: process.env.NODE_ENV,
      jwtSecret: process.env.JWT_SECRET,
    });

    return res;
  } catch (error: any) {
    process.env.NODE_ENV !== "production" &&
      console.error(`${new Date().toISOString()} /api/admin-login: Error`, error.message);
    return NextResponse.json({ error: 'SERVER', message: 'Ошибка сервера' }, { status: 500 });
  }
}
