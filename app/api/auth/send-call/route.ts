// ✅ Путь: app/api/auth/send-call/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone } from '@/lib/normalizePhone';
import { safeJson } from '@/lib/api/safeJson';

export async function POST(req: Request) {
  try {
    const parsed = await safeJson(req, 'AUTH SEND CALL');
    if (!parsed.ok) return parsed.response;

    const { phone: rawPhone } = parsed.data as { phone?: string };

    if (!rawPhone) {
      return NextResponse.json(
        { success: false, error: 'Введите номер телефона' },
        { status: 400 }
      );
    }

    const sanitized = sanitizeHtml(String(rawPhone), { allowedTags: [], allowedAttributes: {} });
    const phone = normalizePhone(sanitized); // +7XXXXXXXXXX

    if (!/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Введите корректный номер в формате +7XXXXXXXXXX' },
        { status: 400 }
      );
    }

    // sms.ru callcheck ждёт номер цифрами (7XXXXXXXXXX)
    const digits11 = phone.replace(/\D/g, ''); // 7XXXXXXXXXX

    // Твоё старое правило "после +7 должен быть 9"
    // Если хочешь - оставляем (я оставил)
    if (!digits11.slice(1).startsWith('9')) {
      return NextResponse.json(
        { success: false, error: 'Номер должен начинаться с 9 после +7' },
        { status: 400 }
      );
    }

    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAttempts = await prisma.auth_logs.count({
      where: {
        phone,
        created_at: { gte: cutoffDate },
      },
    });

    if (recentAttempts >= 30) {
      return NextResponse.json({ success: false, error: 'Слишком много попыток' }, { status: 429 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const smsResponse = await fetch(
      `https://sms.ru/callcheck/add?api_id=${process.env.SMS_RU_API_ID}&phone=${digits11}&json=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const smsData = await smsResponse.json();

    if (!smsResponse.ok || smsData.status !== 'OK') {
      return NextResponse.json(
        { success: false, error: 'Ошибка отправки звонка' },
        { status: smsData.status_code === 203 ? 429 : 500 }
      );
    }

    await prisma.auth_logs.upsert({
      where: { check_id: smsData.check_id },
      update: {
        phone,
        status: 'PENDING',
        updated_at: new Date(),
      },
      create: {
        phone,
        check_id: smsData.check_id,
        status: 'PENDING',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      check_id: smsData.check_id,
      call_phone: smsData.call_phone,
      call_phone_pretty: smsData.call_phone_pretty,
    });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('[auth/send-call]', error);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}
