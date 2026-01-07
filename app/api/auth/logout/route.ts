// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireCsrf } from '@/lib/api/csrf';

export async function POST(req: NextRequest) {
  const csrfError = requireCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  const response = NextResponse.json({ success: true });
  // Стираем куку user_phone
  response.headers.set(
    'Set-Cookie',
    'user_phone=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
  );
  return response;
}
