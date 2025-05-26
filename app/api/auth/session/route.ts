// app/api/auth/session/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Получаем куки из заголовка (работает и в dev, и на сервере)
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies: Record<string, string> = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((v) => v.trim().split('=').map(decodeURIComponent))
      .filter(([k]) => !!k)
  );
  const userPhone = cookies['user_phone'];

  if (!userPhone || !/^\+7\d{10}$/.test(userPhone)) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: { phone: userPhone } }, { status: 200 });
}
