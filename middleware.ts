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
     HELPERS
  -------------------------------------------------------------------------- */
  const hasAnyCookie = (names: string[]) => {
    for (const n of names) {
      if (req.cookies.get(n)?.value) return true;
    }
    return false;
  };

  const hasSupabaseLikeSession = () => {
    const all = req.cookies.getAll().map((c) => c.name);

    // Частые варианты
    if (all.includes('sb-access-token') || all.includes('sb-refresh-token')) return true;

    // Fallback на разные форматы supabase cookies (включая project-ref)
    return all.some((name) => name.startsWith('sb-') && name.includes('auth'));
  };

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
     USER GUARD
     - не хардкодим project-ref cookie
     - проверяем распространённые варианты + fallback
  -------------------------------------------------------------------------- */
  if (
    (pathname.startsWith('/account') || pathname.startsWith('/checkout')) &&
    pathname !== '/account'
  ) {
    const hasCustomAuth =
      hasAnyCookie(['kt_access', 'kt_refresh', 'access_token', 'refresh_token']) ||
      hasAnyCookie(['sb-access-token', 'sb-refresh-token']);

    const ok = hasCustomAuth || hasSupabaseLikeSession();

    if (!ok) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/account';
      loginUrl.searchParams.set('from', pathname);
      loginUrl.searchParams.set('error', 'no-session');
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

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
