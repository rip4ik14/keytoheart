import { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

// Эти маршруты должны быть доступны без CSRF, иначе будет цикл или сломаются внешние вебхуки
const CSRF_EXCLUDE_PREFIXES = [
  '/api/csrf-token',
  '/api/auth/webhook-call', // SMS.ru callcheck_status
  '/api/tg/event',          // если Telegram шлет POST без твоих заголовков
  '/api/payment',           // если у платежки есть callback/webhook
];

function isExcluded(pathname: string) {
  return CSRF_EXCLUDE_PREFIXES.some((p) => pathname.startsWith(p));
}

function isWriteMethod(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF проверяем только на /api/*
  if (!pathname.startsWith('/api/')) return NextResponse.next();

  // Пропускаем исключения
  if (isExcluded(pathname)) return NextResponse.next();

  // Только для "пишущих" методов
  if (!isWriteMethod(req.method)) return NextResponse.next();

  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value || '';
  const headerToken = req.headers.get(CSRF_HEADER) || '';

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json(
      { error: 'CSRF token missing or invalid' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.next();
}

// Чтобы middleware не трогал статику и страницы
export const config = {
  matcher: ['/api/:path*'],
};
