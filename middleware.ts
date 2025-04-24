// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Разрешаем доступ к странице логина без аутентификации
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const authAdmin = req.cookies.get("auth-admin")?.value;
    if (authAdmin !== "true") {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
