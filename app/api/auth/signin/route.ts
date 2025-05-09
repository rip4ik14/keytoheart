import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { phone } = await request.json();
  if (!phone) {
    return NextResponse.json({ error: 'Телефон не указан' }, { status: 400 });
  }

  const phoneRegex = /^\d{10,12}$/;
  if (!phoneRegex.test(phone)) {
    return NextResponse.json({ error: 'Некорректный формат номера телефона' }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('userPhone', phone, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 дней
  });

  return response;
}