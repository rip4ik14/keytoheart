// ✅ Путь: middleware.ts
import { NextRequest, NextResponse } from 'next/server';

/*
  Middleware выполняет ТОЛЬКО:
  - редирект неавторизованных пользователей
  - НИКАКОЙ логики API
  - НИКАКИХ fetch внутрь самого приложения
*/

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* --------------------------------------------------------------------------
     ⛔️ НИКОГДА не трогаем API и системные роуты
  -------------------------------------------------------------------------- */
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap')
  ) {
    return NextResponse.next();
  }

  /* --------------------------------------------------------------------------
     ADMIN GUARD
     - проверяем ТОЛЬКО наличие cookie
     - валидность проверяется уже на сервере
  -------------------------------------------------------------------------- */
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin_session')?.value;

    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('from', pathname);
      loginUrl.searchParams.set('error', 'no-session');
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  /* --------------------------------------------------------------------------
     USER GUARD (Supabase)
     - аналогично: только наличие cookie
  -------------------------------------------------------------------------- */
  if (
    (pathname.startsWith('/account') || pathname.startsWith('/checkout')) &&
    pathname !== '/account'
  ) {
    const token = req.cookies.get('sb-gwbeabfkknhewwoesqax-auth-token')?.value;

    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/account';
      loginUrl.searchParams.set('from', pathname);
      loginUrl.searchParams.set('error', 'no-session');
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  /* --------------------------------------------------------------------------
     Остальной трафик пропускаем
  -------------------------------------------------------------------------- */
  return NextResponse.next();
}

/* --------------------------------------------------------------------------
   ⚠️ КРИТИЧЕСКИ ВАЖНО
   matcher ИСКЛЮЧАЕТ /api
-------------------------------------------------------------------------- */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
