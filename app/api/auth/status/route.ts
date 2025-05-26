// app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Вспомогательная функция парсинга cookies (если потребуется)
function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const [k, v] = part.split('=').map(s => s.trim());
    if (k && v) cookies[k] = v;
  }
  return cookies;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkId = searchParams.get('checkId');
  const phone = searchParams.get('phone')?.replace(/^\+/, '')!;

  if (!checkId || !phone) {
    return NextResponse.json({ success: false, error: 'Недостаточно параметров' }, { status: 400 });
  }

  try {
    // 1. Читаем статус звонка из Prisma (таблица public.auth_logs)
    const log = await prisma.auth_logs.findUnique({
      where: { check_id: checkId },
      select: { status: true, phone: true },
    });
    if (!log) {
      return NextResponse.json({ success: false, error: 'checkId не найден' }, { status: 404 });
    }

    if (log.status === 'VERIFIED' || log.status === 'EXPIRED') {
      // Если уже есть успешная авторизация — кладём куку user_phone и возвращаем успех
      const response = NextResponse.json({ success: true, status: log.status });
      if (log.status === 'VERIFIED') {
        // Кладём куку user_phone на 30 дней
        response.cookies.set('user_phone', log.phone, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 30 * 24 * 3600,
          path: '/',
        });
      }
      return response;
    }

    // 2. Иначе запрашиваем статус у SMS.ru
    const smsRes = await fetch(
      `https://sms.ru/callcheck/status?api_id=${process.env.SMS_RU_API_ID}&check_id=${checkId}&json=1`
    );
    const smsJson = await smsRes.json();
    if (smsJson.status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Ошибка SMS.ru' }, { status: 502 });
    }

    // 3. Маппинг к нашему статусу
    let newStatus: 'PENDING' | 'VERIFIED' | 'EXPIRED' = 'PENDING';
    if (smsJson.check_status === 401) newStatus = 'VERIFIED';
    if (smsJson.check_status === 402) newStatus = 'EXPIRED';

    // 4. Обновляем в Prisma
    await prisma.auth_logs.update({
      where: { check_id: checkId },
      data: { status: newStatus, updated_at: new Date() },
    });

    if (newStatus !== 'VERIFIED') {
      return NextResponse.json({ success: true, status: newStatus });
    }

    // 5. Создаём профиль, если надо
    const exists = await prisma.user_profiles.findUnique({ where: { phone } });
    if (!exists) {
      await prisma.user_profiles.create({
        data: { phone, created_at: new Date(), updated_at: new Date() },
      });
    }

    // 6. Кладём куку user_phone
    const response = NextResponse.json({ success: true, status: newStatus });
    response.cookies.set('user_phone', phone, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600,
      path: '/',
    });
    return response;
  } catch (e: any) {
    console.error('status/route.ts ошибка:', e);
    return NextResponse.json({ success: false, error: e.message || 'Серверная ошибка' }, { status: 500 });
  }
}
