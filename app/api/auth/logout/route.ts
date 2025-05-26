// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('user_phone', '', {
    maxAge: 0,
    path: '/',
  });
  return response;
}