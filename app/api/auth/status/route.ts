// ✅ Путь: app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone } from '@/lib/normalizePhone';

// Вынес статусы в тип, чтобы не было опечаток
type LogStatus = 'PENDING' | 'VERIFIED' | 'EXPIRED';

function mapSmsStatus(check_status: any): LogStatus {
  if (Number(check_status) === 401) return 'VERIFIED';
  if (Number(check_status) === 402) return 'EXPIRED';
  return 'PENDING';
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const checkIdRaw = searchParams.get('checkId');
  const phoneRaw = searchParams.get('phone');

  const checkId = sanitizeHtml(checkIdRaw || '', { allowedTags: [], allowedAttributes: {} }).trim();
  const phoneInput = sanitizeHtml(phoneRaw || '', { allowedTags: [], allowedAttributes: {} }).trim();

  const phoneFromQuery = normalizePhone(phoneInput);

  if (!checkId) {
    return NextResponse.json(
      { success: false, error: 'checkId обязателен' },
      { status: 400 }
    );
  }

  // phone в query оставляем обязательным, потому что фронт его передаёт,
  // и нам удобно сверить, что checkId действительно для этого номера.
  if (!phoneFromQuery || !/^\+7\d{10}$/.test(phoneFromQuery)) {
    return NextResponse.json(
      { success: false, error: 'Некорректный формат phone (нужен +7XXXXXXXXXX)' },
      { status: 400 }
    );
  }

  try {
    // 1) Получаем лог по check_id
    const log = await prisma.auth_logs.findUnique({
      where: { check_id: checkId },
      select: { status: true, phone: true },
    });

    if (!log) {
      return NextResponse.json(
        { success: false, error: 'checkId не найден' },
        { status: 404 }
      );
    }

    const phoneFromLog = normalizePhone(log.phone);

    // 2) Защита: checkId должен соответствовать тому же телефону, что и в логе
    // Иначе можно взять чужой checkId и передать свой phone, чтобы получить куку.
    if (phoneFromLog && /^\+7\d{10}$/.test(phoneFromLog) && phoneFromLog !== phoneFromQuery) {
      return NextResponse.json(
        { success: false, error: 'checkId не соответствует номеру телефона' },
        { status: 400 }
      );
    }

    // 3) Если уже финальный статус - возвращаем сразу
    if (log.status === 'VERIFIED' || log.status === 'EXPIRED') {
      const resp = NextResponse.json({ success: true, status: log.status });

      if (log.status === 'VERIFIED') {
        // Всегда кладём в куку канонический номер
        resp.cookies.set('user_phone', phoneFromLog || phoneFromQuery, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 3600,
          path: '/',
        });
      }

      return resp;
    }

    // 4) Запрашиваем статус у SMS.ru
    const smsRes = await fetch(
      `https://sms.ru/callcheck/status?api_id=${process.env.SMS_RU_API_ID}&check_id=${encodeURIComponent(checkId)}&json=1`
    );

    const smsJson = await smsRes.json();

    if (!smsRes.ok || smsJson?.status !== 'OK') {
      return NextResponse.json(
        { success: false, error: 'Ошибка SMS.ru' },
        { status: 502 }
      );
    }

    const newStatus: LogStatus = mapSmsStatus(smsJson?.check_status);

    // 5) Обновляем статус в БД
    await prisma.auth_logs.update({
      where: { check_id: checkId },
      data: {
        status: newStatus,
        updated_at: new Date(),
        // на всякий случай фиксируем phone в каноническом виде
        phone: phoneFromLog || phoneFromQuery,
      },
    });

    // 6) Если не VERIFIED - просто вернуть
    if (newStatus !== 'VERIFIED') {
      return NextResponse.json({ success: true, status: newStatus });
    }

    const finalPhone = phoneFromLog || phoneFromQuery;

    // 7) Создаём профиль пользователя, если ещё нет
    const exists = await prisma.user_profiles.findUnique({ where: { phone: finalPhone } });
    if (!exists) {
      await prisma.user_profiles.create({
        data: { phone: finalPhone, created_at: new Date(), updated_at: new Date() },
      });
    }

    // 8) Кладём httpOnly cookie user_phone
    const response = NextResponse.json({ success: true, status: newStatus });
    response.cookies.set('user_phone', finalPhone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600,
      path: '/',
    });

    return response;
  } catch (e: any) {
    process.env.NODE_ENV !== 'production' && console.error('app/api/auth/status ошибка:', e);
    return NextResponse.json(
      { success: false, error: e.message || 'Серверная ошибка' },
      { status: 500 }
    );
  }
}
