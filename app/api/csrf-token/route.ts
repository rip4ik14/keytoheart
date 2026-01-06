// ✅ Путь: app/api/csrf-token/route.ts
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET() {
  // Генерируем случайный CSRF-токен
  const csrfToken = randomBytes(32).toString('hex');

  // Сохраняем токен в cookie (или можно использовать сессию)
  const response = NextResponse.json({ csrfToken });
  response.cookies.set('csrf_token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 час
  });

  return response;
}