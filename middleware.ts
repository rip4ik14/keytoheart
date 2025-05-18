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

  // Устанавливаем CSP заголовок для всех маршрутов
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
    return response;
  }

  // Пропускаем API маршруты
  if (pathname.startsWith('/api')) {
    return response;
  }

  // Проверяем токен для /admin
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_session')?.value;

    if (!token) {
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
        const login = url.clone();
        login.pathname = '/admin/login';
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', 'invalid-session');
        return NextResponse.redirect(login);
      }

      return response;
    } catch (error) {
      console.error('Admin middleware auth error:', error);
      const login = url.clone();
      login.pathname = '/admin/login';
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'invalid-session');
      return NextResponse.redirect(login);
    }
  }

  // Проверяем токен для /account и /checkout
  if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
    const token = req.cookies.get('sb-access-token')?.value;

    if (!token) {
      const login = url.clone();
      login.pathname = '/account'; // Изменено с /login на /account
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'no-session');
      return NextResponse.redirect(login);
    }

    try {
      const { data: userData, error } = await supabase.auth.getUser(token);
      if (error || !userData.user) {
        const login = url.clone();
        login.pathname = '/account'; // Изменено с /login на /account
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', 'invalid-session');
        return NextResponse.redirect(login);
      }
    } catch (error) {
      console.error('User middleware auth error:', error);
      const login = url.clone();
      login.pathname = '/account'; // Изменено с /login на /account
      login.searchParams.set('from', pathname);
      login.searchParams.set('error', 'invalid-session');
      return NextResponse.redirect(login);
    }
  }

  return response;
}

export const config = {
  matcher: ['/:path*'],
};