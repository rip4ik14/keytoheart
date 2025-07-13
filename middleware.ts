/* -------------------------------------------------------------------------- */
/*  middleware.ts — access guards & redirects (Edge Runtime)                  */
/*  Версия: 2025-07-13                                                        */
/* -------------------------------------------------------------------------- */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/* -------------------------- Константы и утилиты --------------------------- */
const ADMIN_COOKIE  = 'admin_session';
const SB_COOKIE     = 'sb-gwbeabfkknhewwoesqax-auth-token';
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const JWT_SECRET    = process.env.ADMIN_JWT_SECRET!; // ➟ добавьте в .env

const isValidAdminToken = (token?: string) => {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { exp: number };
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const buildRedirect = (origin: URL, to: string, reason: string, from: string) => {
  const redirectUrl = new URL(origin.toString());
  redirectUrl.pathname = to;
  redirectUrl.searchParams.set('from', from);
  redirectUrl.searchParams.set('error', reason);
  return NextResponse.redirect(redirectUrl);
};

/* -------------------------------------------------------------------------- */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // Пропускаем все запросы, кроме GET / HEAD
  if (!['GET', 'HEAD'].includes(method)) return NextResponse.next();

  /* ------------------------------- ADMIN ---------------------------------- */
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!isValidAdminToken(token)) {
      return buildRedirect(
        req.nextUrl,
        '/admin/login',
        token ? 'invalid-session' : 'no-session',
        pathname,
      );
    }
  }

  /* --------------------------- USER (Supabase) ---------------------------- */
  if (
    (pathname.startsWith('/account') || pathname.startsWith('/checkout')) &&
    pathname !== '/account'
  ) {
    const token = req.cookies.get(SB_COOKIE)?.value;
    if (!token) {
      return buildRedirect(req.nextUrl, '/account', 'no-session', pathname);
    }
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
      });
      if (!res.ok) throw new Error('invalid');
    } catch {
      return buildRedirect(req.nextUrl, '/account', 'invalid-session', pathname);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*'],
};
