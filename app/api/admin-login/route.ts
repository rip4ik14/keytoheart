import { NextRequest, NextResponse } from 'next/server';
import { signAdminJwt } from '@/lib/auth';
import { safeBody } from '@/lib/api/safeBody';

export async function POST(req: NextRequest) {
  const body = await safeBody<{ password?: string }>(req, 'ADMIN LOGIN API');
  if (body instanceof NextResponse) {
    return body;
  }

  const { password } = body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    process.env.NODE_ENV !== 'production' &&
      console.warn(`${new Date().toISOString()} /api/admin-login: Invalid password attempt`);
    return NextResponse.json({ error: 'NEAUTH', message: 'Неверный пароль' }, { status: 401 });
  }

  try {
    const token = await signAdminJwt();
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    process.env.NODE_ENV !== 'production' &&
      console.log(`${new Date().toISOString()} /api/admin-login: Session cookie set`);

    return res;
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error(`${new Date().toISOString()} /api/admin-login: Error`, error?.message);
    return NextResponse.json({ error: 'SERVER', message: 'Ошибка сервера' }, { status: 500 });
  }
}
