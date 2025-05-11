import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Устанавливаем CSP заголовок для всех маршрутов
  const response = NextResponse.next();
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://mc.yandex.com https://mc.yandex.ru",
    "connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co wss://gwbeabfkknhewwoesqax.supabase.co https://mc.yandex.com https://mc.yandex.ru",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://mc.yandex.com https://mc.yandex.ru",
    "font-src 'self' data:", // Разрешаем шрифты через data:
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // Пропускаем /admin/login
  if (pathname === "/admin/login") {
    return response;
  }

  // Пропускаем API маршруты
  if (pathname.startsWith("/api")) {
    return response;
  }

  // Проверяем токен только для маршрутов, начинающихся с /admin
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("admin_session")?.value;

    if (!token) {
      const login = url.clone();
      login.pathname = "/admin/login";
      login.searchParams.set("from", pathname);
      login.searchParams.set("error", "no-session");
      return NextResponse.redirect(login);
    }

    try {
      // Вызываем API-роут для верификации токена
      const verifyRes = await fetch(new URL('/api/verify-session', req.url), {
        headers: {
          Cookie: `admin_session=${token}`,
        },
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        const login = url.clone();
        login.pathname = "/admin/login";
        login.searchParams.set("from", pathname);
        login.searchParams.set("error", "invalid-session");
        return NextResponse.redirect(login);
      }

      return response;
    } catch (error) {
      const login = url.clone();
      login.pathname = "/admin/login";
      login.searchParams.set("from", pathname);
      login.searchParams.set("error", "invalid-session");
      return NextResponse.redirect(login);
    }
  }

  return response;
}

export const config = {
  matcher: ["/:path*"],
};