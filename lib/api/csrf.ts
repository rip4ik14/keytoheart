import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'csrf_token';

export function requireCsrf(req: NextRequest): NextResponse | null {
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;

  if (!cookieToken) {
    return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
  }

  const headerToken = req.headers.get('x-csrf-token');
  if (!headerToken || headerToken !== cookieToken) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  return null;
}
