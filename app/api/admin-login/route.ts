// ✅ Путь: app/api/admin-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signAdminJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'NEAUTH', message: 'Пароль обязателен' }, { status: 400 });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'NEAUTH', message: 'Неверный пароль' }, { status: 401 });
    }

    // Дожидаемся генерации токена
    const token = await signAdminJwt();
    if (!token || typeof token !== 'string') {
      throw new Error('Не удалось сгенерировать токен');
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 часов
    });

    return res;
  } catch (err: any) {
    console.error('API /admin-login POST error:', err);
    return NextResponse.json(
      { error: 'NEAUTH', message: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}