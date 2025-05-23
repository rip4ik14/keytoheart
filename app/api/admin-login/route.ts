import { NextRequest, NextResponse } from 'next/server';
import { signAdminJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    console.log('Received password:', password);
    console.log('Expected ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD);

    if (!password) {
      return NextResponse.json({ error: 'NEAUTH', message: 'Пароль обязателен' }, { status: 400 });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      console.log('Password mismatch');
      return NextResponse.json({ error: 'NEAUTH', message: 'Неверный пароль' }, { status: 401 });
    }

    const token = await signAdminJwt();
    if (!token || typeof token !== 'string') {
      throw new Error('Не удалось сгенерировать токен');
    }

    console.log('Generated admin_session token:', token);

    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 часов
    });

    console.log('Set admin_session cookie');
    return res;
  } catch (err: any) {
    console.error('API /admin-login POST error:', err);
    return NextResponse.json(
      { error: 'NEAUTH', message: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}