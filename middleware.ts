// ✅ Путь: middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// ──────────────────────────────────────────────────────────────────────────────
//  Middleware без CSP-заголовка.
//  CSP задаётся единственным источником — в next.config.js → headers().
// ──────────────────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  /* --------------------------------------------------------------------------
     ADMIN GUARD
  -------------------------------------------------------------------------- */
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin_session')?.value;

    if (!token) {
      const login = url.clone();
      login.pathname = '/admin/login';
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'no-session');
      return NextResponse.redirect(login);
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin-session`,
        { headers: { Cookie: `admin_session=${token}` } },
      );
      const { success } = await res.json();
      if (!success) throw new Error('invalid');
    } catch {
      const login = url.clone();
      login.pathname = '/admin/login';
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'invalid-session');
      return NextResponse.redirect(login);
    }
  }

  /* --------------------------------------------------------------------------
     USER GUARD (Supabase)
  -------------------------------------------------------------------------- */
  if (
    (pathname.startsWith('/account') || pathname.startsWith('/checkout')) &&
    pathname !== '/account'
  ) {
    const token = req.cookies.get('sb-gwbeabfkknhewwoesqax-auth-token')?.value;

    if (!token) {
      const login = url.clone();
      login.pathname = '/account';
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'no-session');
      return NextResponse.redirect(login);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      });
      if (!res.ok) throw new Error('invalid');
    } catch {
      const login = url.clone();
      login.pathname = '/account';
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'invalid-session');
      return NextResponse.redirect(login);
    }
  }

  // остальной трафик пропускаем
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
