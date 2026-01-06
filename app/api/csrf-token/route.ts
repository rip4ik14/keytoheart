// ✅ Путь: app/api/csrf-token/route.ts
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function makeResponse() {
  const csrfToken = randomBytes(32).toString('hex')

  const res = NextResponse.json({ csrfToken })

  res.cookies.set('csrf_token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // важно: lax, не strict
    path: '/',
    maxAge: 60 * 60, // 1 час
  })

  // важное: запрет кеша
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')

  return res
}

export async function GET() {
  return makeResponse()
}

export async function POST() {
  return makeResponse()
}
