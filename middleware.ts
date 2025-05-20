import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  console.log(`[${new Date().toISOString()}] Middleware processing: ${pathname}`);

  // Пропускаем API маршруты без CSP
  if (pathname.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] Skipping CSP for API route: ${pathname}`);
    return NextResponse.next();
  }

  // Устанавливаем CSP заголовок для не-API маршрутов
  const response = NextResponse.next();
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
  response.headers.set('Content-Security-Policy', csp);

  // Пропускаем /admin/login и /account
  if (pathname === '/admin/login' || pathname === '/account') {
    console.log(`[${new Date().toISOString()}] Allowing direct access to: ${pathname}`);
    return response;
  }

  // Проверяем токен для /admin
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_session')?.value;

    if (!token) {
      console.log(`[${new Date().toISOString()}] No admin_session token found for /admin route`);
      const login = url.clone();
      login.pathname = '/admin/login';
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'no-session');
      return NextResponse.redirect(login);
    }

    try {
      const verifyRes = await fetch(new URL('/api/verify-session', req.url), {
        headers: {
          Cookie: `admin_session=${token}`,
        },
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        console.log(`[${new Date().toISOString()}] Invalid admin_session token:`, verifyData);
        const login = url.clone();
        login.pathname = '/admin/login';
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', 'invalid-session');
        return NextResponse.redirect(login);
      }

      console.log(`[${new Date().toISOString()}] Admin session verified for: ${pathname}`);
      return response;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Admin middleware auth error:`, error);
      const login = url.clone();
      login.pathname = '/admin/login';
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'invalid-session');
      return NextResponse.redirect(login);
    }
  }

  // Проверяем токен для /account и /checkout
  if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
    const token = req.cookies.get('access_token')?.value;

    if (!token) {
      console.log(`[${new Date().toISOString()}] No access_token found for ${pathname}`);
      const login = url.clone();
      login.pathname = '/account';
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'no-session');
      return NextResponse.redirect(login);
    }

    try {
      console.log(`[${new Date().toISOString()}] Verifying access_token: ${token}`);
      const { data: userData, error } = await supabase.auth.getUser(token);
      if (error || !userData.user) {
        console.error(`[${new Date().toISOString()}] Invalid access_token for ${pathname}:`, error?.message || 'No user data');
        const login = url.clone();
        login.pathname = '/account';
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', 'invalid-session');
        return NextResponse.redirect(login);
      }
      console.log(`[${new Date().toISOString()}] Successfully verified access_token for ${pathname}, user: ${userData.user.id}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] User middleware auth error for ${pathname}:`, error);
      const login = url.clone();
      login.pathname = '/account';
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'invalid-session');
      return NextResponse.redirect(login);
    }
  }

  console.log(`[${new Date().toISOString()}] Allowing access to: ${pathname}`);
  return response;
}

export const config = {
  matcher: ['/:path*'],
};