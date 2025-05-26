import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';
import { verifyAdminJwt } from '@/lib/auth';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // CSP только для не-API
  if (!pathname.startsWith('/api')) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://mc.yandex.com https://mc.yandex.ru https://api-maps.yandex.ru",
      "connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co wss://gwbeabfkknhewwoesqax.supabase.co https://mc.yandex.com https://mc.yandex.ru https://www.google-analytics.com https://api-maps.yandex.ru",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://via.placeholder.com https://example.com https://keytoheart.ru https://*.yandex.net https://*.yandex.ru https://mc.yandex.com https://mc.yandex.ru",
      "font-src 'self' data:",
      "frame-src 'self' https://mc.yandex.com https://mc.yandex.ru https://yandex.ru https://*.yandex.ru",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "worker-src 'self'",
    ].join('; ');
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', csp);

    // --- ADMIN GUARD SSR ---
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      const token = req.cookies.get('admin_session')?.value;
      if (!token || !verifyAdminJwt(token)) {
        const login = url.clone();
        login.pathname = '/admin/login';
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', token ? 'invalid-session' : 'no-session');
        return NextResponse.redirect(login);
      }
    }

    // --- USER GUARD (Supabase) ---
    if ((pathname.startsWith('/account') || pathname.startsWith('/checkout')) && pathname !== '/account') {
      const token = req.cookies.get('access_token')?.value;
      if (!token) {
        const login = url.clone();
        login.pathname = '/account';
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', 'no-session');
        return NextResponse.redirect(login);
      }
      try {
        const { data: userData, error } = await supabase.auth.getUser(token);
        if (error || !userData.user) {
          const login = url.clone();
          login.pathname = '/account';
          login.searchParams.set('from', pathname);
          login.searchParams.set('error', 'invalid-session');
          return NextResponse.redirect(login);
        }
      } catch {
        const login = url.clone();
        login.pathname = '/account';
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', 'invalid-session');
        return NextResponse.redirect(login);
      }
    }

    return response;
  }

  // --- API passthrough ---
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
