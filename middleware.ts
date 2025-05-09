import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Пропускаем маршруты, которые не начинаются с /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Пропускаем /admin/login
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Пропускаем API маршруты
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

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

    return NextResponse.next();
  } catch (error) {
    const login = url.clone();
    login.pathname = "/admin/login";
    login.searchParams.set("from", pathname);
    login.searchParams.set("error", "invalid-session");
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};