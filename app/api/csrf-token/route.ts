import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const COOKIE_NAME = 'csrf_token';

function issueToken() {
  return randomBytes(32).toString('hex');
}

function respondWithToken(req: NextRequest) {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  const token = existing || issueToken();

  const res = NextResponse.json({ csrfToken: token }, { status: 200 });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return res;
}

export async function GET(req: NextRequest) {
  return respondWithToken(req);
}

export async function POST(req: NextRequest) {
  return respondWithToken(req);
}
