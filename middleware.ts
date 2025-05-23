// ✅ Путь: middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Функция проверки админ токена
function verifyAdminToken(token: string): boolean {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return false;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    return !!(decoded && typeof decoded === 'object' && decoded.role === 'admin');
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const method = req.method;

  console.log(`[${new Date().toISOString()}] Middleware: ${method} ${pathname}`);

  // ВСЕГДА пропускаем API маршруты - никаких проверок!
  if (pathname.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] Skipping all checks for API route: ${method} ${pathname}`);
    return NextResponse.next();
  }

  // Пропускаем статические файлы и Next.js служебные файлы
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Создаем базовый response
  const response = NextResponse.next();
  
  // Устанавливаем CSP заголовки только для HTML страниц
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

  // Пропускаем публичные страницы без проверок
  const publicPaths = [
    '/',
    '/catalog',
    '/about',
    '/contacts',
    '/cart',
    '/policy',
    '/terms',
    '/admin/login',
    '/account'
  ];

  if (publicPaths.includes(pathname)) {
    console.log(`[${new Date().toISOString()}] Allowing public access to: ${pathname}`);
    return response;
  }

  // Проверяем админские маршруты
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_session')?.value;

    if (!token) {
      console.log(`[${new Date().toISOString()}] No admin token for: ${pathname}`);
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      loginUrl.searchParams.set('error', 'no-session');
      return NextResponse.redirect(loginUrl);
    }

    // Проверяем токен локально, БЕЗ fetch запроса
    const isValidToken = verifyAdminToken(token);
    
    if (!isValidToken) {
      console.log(`[${new Date().toISOString()}] Invalid admin token for: ${pathname}`);
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      loginUrl.searchParams.set('error', 'invalid-session');
      return NextResponse.redirect(loginUrl);
    }

    console.log(`[${new Date().toISOString()}] Admin access granted for: ${pathname}`);
    return response;
  }

  // Проверяем пользовательские защищенные маршруты
  if (pathname.startsWith('/checkout')) {
    const token = req.cookies.get('access_token')?.value;

    if (!token) {
      console.log(`[${new Date().toISOString()}] No user token for: ${pathname}`);
      const loginUrl = new URL('/account', req.url);
      loginUrl.searchParams.set('from', pathname);
      loginUrl.searchParams.set('error', 'no-session');
      return NextResponse.redirect(loginUrl);
    }

    console.log(`[${new Date().toISOString()}] User access granted for: ${pathname}`);
    return response;
  }

  console.log(`[${new Date().toISOString()}] Allowing access to: ${pathname}`);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};