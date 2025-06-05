// app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Утилита для нормализации номера (только цифры, всегда +7...)
function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  let num = raw.replace(/\D/g, '');
  if (num.startsWith('8')) num = '7' + num.slice(1);
  if (!num.startsWith('7')) num = '7' + num;
  return `+${num.slice(0, 11)}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkId = searchParams.get('checkId');
  const phoneRaw = searchParams.get('phone');
  const phone = normalizePhone(phoneRaw);

  if (!checkId || !phone || !/^\+7\d{10}$/.test(phone)) {
    return NextResponse.json({ success: false, error: 'Недостаточно или неверный формат параметров' }, { status: 400 });
  }

  try {
    // 1. Проверка статуса звонка в БД (auth_logs)
    const log = await prisma.auth_logs.findUnique({
      where: { check_id: checkId },
      select: { status: true, phone: true },
    });

    if (!log) {
      return NextResponse.json({ success: false, error: 'checkId не найден' }, { status: 404 });
    }

    // 2. Если уже VERIFIED/EXPIRED, вернуть сразу результат
    if (log.status === 'VERIFIED' || log.status === 'EXPIRED') {
      const resp = NextResponse.json({ success: true, status: log.status });
      if (log.status === 'VERIFIED') {
        resp.cookies.set('user_phone', normalizePhone(log.phone), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 3600,
          path: '/',
        });
      }
      return resp;
    }

    // 3. Запрашиваем статус у SMS.ru
    const smsRes = await fetch(
      `https://sms.ru/callcheck/status?api_id=${process.env.SMS_RU_API_ID}&check_id=${checkId}&json=1`
    );
    const smsJson = await smsRes.json();
    if (smsJson.status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Ошибка SMS.ru' }, { status: 502 });
    }

    // 4. Маппинг статуса SMS.ru к нашему
    let newStatus: 'PENDING' | 'VERIFIED' | 'EXPIRED' = 'PENDING';
    if (smsJson.check_status === 401) newStatus = 'VERIFIED';
    if (smsJson.check_status === 402) newStatus = 'EXPIRED';

    // 5. Обновляем в БД
    await prisma.auth_logs.update({
      where: { check_id: checkId },
      data: { status: newStatus, updated_at: new Date() },
    });

    // 6. Если не VERIFIED — просто вернуть
    if (newStatus !== 'VERIFIED') {
      return NextResponse.json({ success: true, status: newStatus });
    }

    // 7. Создаём профиль пользователя, если ещё нет
    const exists = await prisma.user_profiles.findUnique({ where: { phone } });
    if (!exists) {
      await prisma.user_profiles.create({
        data: { phone, created_at: new Date(), updated_at: new Date() },
      });
    }

    // 8. Кладём httpOnly куку user_phone
    const response = NextResponse.json({ success: true, status: newStatus });
    response.cookies.set('user_phone', phone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600,
      path: '/',
    });
    return response;

  } catch (e: any) {
    process.env.NODE_ENV !== "production" && console.error('status/route.ts ошибка:', e);
    return NextResponse.json({ success: false, error: e.message || 'Серверная ошибка' }, { status: 500 });
  }
}
