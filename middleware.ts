import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} Middleware: Processing ${pathname}`, {
    cookies: req.cookies.getAll(),
    url: url.toString(),
    nodeEnv: process.env.NODE_ENV,
  });

  // CSP только для не-API
  if (!pathname.startsWith('/api')) {
    const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.com https://mc.yandex.ru https://api-maps.yandex.ru https://cdn.turbo.yandex.ru https://yastatic.net https://*.yastatic.net",
  "connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co https://mc.yandex.com https://mc.yandex.ru https://api-maps.yandex.ru https://yastatic.net",
  "style-src 'self' 'unsafe-inline' https://yastatic.net https://*.yastatic.net",
  "img-src 'self' data: blob: https://*.supabase.co https://via.placeholder.com https://keytoheart.ru https://*.yandex.net https://*.yandex.ru https://mc.yandex.com https://yastatic.net https://*.yastatic.net",
  "font-src 'self' data: https://yastatic.net https://*.yastatic.net",
  "frame-src 'self' https://mc.yandex.com https://yandex.ru https://*.yandex.ru",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "worker-src 'self'",
].join('; ');
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', csp);

    // --- ADMIN GUARD ---
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      const token = req.cookies.get('admin_session')?.value;
      process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} Middleware: Admin session check`, { token });

      if (!token) {
        const login = url.clone();
        login.pathname = '/admin/login';
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', 'no-session');
        process.env.NODE_ENV !== "production" && console.warn(`${new Date().toISOString()} Middleware: Redirecting to /admin/login`, {
          error: 'no-session',
        });
        return NextResponse.redirect(login);
      }

      // Проверяем токен через API-роут
      try {
        const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin-session`, {
          method: 'GET',
          headers: {
            Cookie: `admin_session=${token}`,
          },
        });
        const sessionData = await sessionRes.json();
        process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} Middleware: Admin session verification response`, sessionData);

        if (!sessionRes.ok || !sessionData.success) {
          const login = url.clone();
          login.pathname = '/admin/login';
          login.searchParams.set('from', pathname);
          login.searchParams.set('error', 'invalid-session');
          process.env.NODE_ENV !== "production" && console.warn(`${new Date().toISOString()} Middleware: Redirecting to /admin/login`, {
            error: 'invalid-session',
          });
          return NextResponse.redirect(login);
        }
      } catch (err) {
        process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} Middleware: Error verifying admin session`, err);
        const login = url.clone();
        login.pathname = '/admin/login';
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', 'invalid-session');
        process.env.NODE_ENV !== "production" && console.warn(`${new Date().toISOString()} Middleware: Redirecting to /admin/login`, {
          error: 'invalid-session',
        });
        return NextResponse.redirect(login);
      }
    }

    // --- USER GUARD (Supabase) ---
    if ((pathname.startsWith('/account') || pathname.startsWith('/checkout')) && pathname !== '/account') {
      const token = req.cookies.get('sb-gwbeabfkknhewwoesqax-auth-token')?.value;
      process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} Middleware: User session check`, { token });

      if (!token) {
        const login = url.clone();
        login.pathname = '/account';
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', 'no-session');
        process.env.NODE_ENV !== "production" && console.warn(`${new Date().toISOString()} Middleware: Redirecting to /account`, {
          error: 'no-session',
        });
        return NextResponse.redirect(login);
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        });
        if (!res.ok) {
          throw new Error('Invalid session');
        }
      } catch {
        const login = url.clone();
        login.pathname = '/account';
        login.searchParams.set('from', pathname);
        login.searchParams.set('error', 'invalid-session');
        process.env.NODE_ENV !== "production" && console.warn(`${new Date().toISOString()} Middleware: Redirecting to /account`, {
          error: 'invalid-session',
        });
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