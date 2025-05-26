// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Стираем куку user_phone
  response.headers.set(
    'Set-Cookie',
    'user_phone=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
  );
  return response;
}
