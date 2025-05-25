import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Введите номер телефона' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('7')) {
      return NextResponse.json(
        { success: false, error: 'Введите корректный номер в формате +7XXXXXXXXXX' },
        { status: 400 }
      );
    }

    if (!cleanPhone.slice(1).startsWith('9')) {
      return NextResponse.json(
        { success: false, error: 'Номер должен начинаться с 9 после +7' },
        { status: 400 }
      );
    }

    // Проверка количества попыток (за последние 24 часа)
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAttempts = await prisma.auth_logs.count({
      where: {
        phone: `+${cleanPhone}`,
        created_at: { gte: cutoffDate },
      },
    });

    if (recentAttempts >= 30) {
      return NextResponse.json({ success: false, error: 'Слишком много попыток' }, { status: 429 });
    }

    // Отправка запроса к SMS.ru
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const smsResponse = await fetch(
      `https://sms.ru/callcheck/add?api_id=${process.env.SMS_RU_API_ID}&phone=${cleanPhone}&json=1`,
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

    // Запись или обновление лога попытки авторизации
    await prisma.auth_logs.upsert({
      where: { check_id: smsData.check_id },
      update: {
        phone: `+${cleanPhone}`,
        status: 'PENDING',
        updated_at: new Date(),
      },
      create: {
        phone: `+${cleanPhone}`,
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
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}
