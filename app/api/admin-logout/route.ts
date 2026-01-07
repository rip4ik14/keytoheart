// Путь: app/api/admin-logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireCsrf } from '@/lib/api/csrf';

export async function POST(req: NextRequest) {
  const csrfError = requireCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // мгновенно удаляет cookie
  });
  return res;
}
