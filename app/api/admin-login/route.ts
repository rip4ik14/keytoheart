import { NextRequest, NextResponse } from 'next/server';
import { signAdminJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

<<<<<<< HEAD
  process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} /api/admin-login: Received request`, { password });

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    process.env.NODE_ENV !== "production" && console.warn(`${new Date().toISOString()} /api/admin-login: Invalid password`, {
      expected: process.env.ADMIN_PASSWORD,
=======
process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} /api/admin-login: Received request`, { password });
  if (!password || password !== process.env.ADMIN_PASSWORD) {
process.env.NODE_ENV !== "production" && console.warn(`${new Date().toISOString()} /api/admin-login: Invalid password`, {      expected: process.env.ADMIN_PASSWORD,
>>>>>>> d253a58 (Мои локальные правки перед pull)
      received: password,
    });
    return NextResponse.json({ error: 'NEAUTH', message: 'Неверный пароль' }, { status: 401 });
  }

  try {
    const token = await signAdminJwt();
<<<<<<< HEAD
    process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} /api/admin-login: JWT generated`, { token });

=======
process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} /api/admin-login: JWT generated`, { token });
>>>>>>> d253a58 (Мои локальные правки перед pull)
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

<<<<<<< HEAD
    process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} /api/admin-login: Cookie admin_session set`, {
      cookie: res.cookies.get('admin_session'),
=======
 process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} /api/admin-login: Cookie admin_session set`, {      cookie: res.cookies.get('admin_session'),
>>>>>>> d253a58 (Мои локальные правки перед pull)
      setCookieHeader: res.headers.get('set-cookie'),
      nodeEnv: process.env.NODE_ENV,
      jwtSecret: process.env.JWT_SECRET,
    });

    return res;
  } catch (error: any) {
<<<<<<< HEAD
    process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} /api/admin-login: Error`, error.message);
    return NextResponse.json({ error: 'SERVER', message: 'Ошибка сервера' }, { status: 500 });
=======
process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} /api/admin-login: Error`, error.message);    return NextResponse.json({ error: 'SERVER', message: 'Ошибка сервера' }, { status: 500 });
>>>>>>> d253a58 (Мои локальные правки перед pull)
  }
}