// ✅ Путь: middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname

  // 1) НИКОГДА не трогаем api и next-ассеты
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap')
  ) {
    return NextResponse.next()
  }

  /* --------------------------------------------------------------------------
     ADMIN GUARD
  -------------------------------------------------------------------------- */
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin_session')?.value

    if (!token) {
      const login = url.clone()
      login.pathname = '/admin/login'
      login.searchParams.set('from', pathname)
      login.searchParams.set('error', 'no-session')
      return NextResponse.redirect(login)
    }

    try {
      // важно: использовать origin текущего запроса
      const res = await fetch(`${url.origin}/api/admin-session`, {
        headers: { Cookie: `admin_session=${token}` },
        cache: 'no-store',
      })

      const data = await res.json().catch(() => null)
      if (!data?.success) throw new Error('invalid')
    } catch {
      const login = url.clone()
      login.pathname = '/admin/login'
      login.searchParams.set('from', pathname)
      login.searchParams.set('error', 'invalid-session')
      return NextResponse.redirect(login)
    }
  }

  /* --------------------------------------------------------------------------
     USER GUARD (Supabase)
  -------------------------------------------------------------------------- */
  if (
    (pathname.startsWith('/account') || pathname.startsWith('/checkout')) &&
    pathname !== '/account'
  ) {
    const token = req.cookies.get('sb-gwbeabfkknhewwoesqax-auth-token')?.value

    if (!token) {
      const login = url.clone()
      login.pathname = '/account'
      login.searchParams.set('from', pathname)
      login.searchParams.set('error', 'no-session')
      return NextResponse.redirect(login)
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('invalid')
    } catch {
      const login = url.clone()
      login.pathname = '/account'
      login.searchParams.set('from', pathname)
      login.searchParams.set('error', 'invalid-session')
      return NextResponse.redirect(login)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}
