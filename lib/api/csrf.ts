import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'csrf_token';

export function requireCsrf(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  if (origin && host) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return NextResponse.json({ error: 'Invalid Origin header' }, { status: 403 });
    }

    const normalizeHost = (value: string) => value.trim().toLowerCase().replace(/^www\./, '');

    if (normalizeHost(originHost) !== normalizeHost(host)) {
      return NextResponse.json({ error: 'Origin mismatch' }, { status: 403 });
    }
  }

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
