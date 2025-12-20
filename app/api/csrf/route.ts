import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

function ensureCsrfCookie(req: NextRequest, res: NextResponse) {
  let token = req.cookies.get('csrf_token')?.value;

  if (!token) {
    token = randomBytes(32).toString('hex');
    res.cookies.set('csrf_token', token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
  }

  return token;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const token = ensureCsrfCookie(req, res);
  res.headers.set('x-csrf-token', token);
  return res;
}
