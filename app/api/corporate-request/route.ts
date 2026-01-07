// ✅ Путь: app/api/corporate-request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeBody } from '@/lib/api/safeBody';
import { requireCsrf } from '@/lib/api/csrf';

const TELEGRAM_TOKEN =
  process.env.CORPORATE_TELEGRAM_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  '';
const TELEGRAM_CHAT_ID =
  process.env.CORPORATE_TELEGRAM_CHAT_ID ||
  process.env.TELEGRAM_CHAT_ID ||
  '';

interface CorporateRequestBody {
  name: string;
  company?: string;
  phone: string;
  email: string;
  message?: string;
}

// Экранирование HTML для Telegram
const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export async function POST(req: NextRequest) {
  try {
    const csrfError = requireCsrf(req);
    if (csrfError) {
      return csrfError;
    }

    const body = await safeBody<CorporateRequestBody>(req, 'CORPORATE REQUEST API');
    if (body instanceof NextResponse) {
      return body;
    }

    // 👀 Логируем входящее тело ВСЕГДА, даже в production
    console.log('[CORPORATE] Incoming body:', body);

    const { name, company, phone, email, message } = body;

    // --- Валидация обязательных полей ---
    if (!name || !phone || !email) {
      console.error('[CORPORATE] Validation error: missing fields', {
        name,
        phone,
        email,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Пожалуйста, заполните все обязательные поля.',
        },
        { status: 400 }
      );
    }

    // --- Телефон: ожидаем формат +7XXXXXXXXXX ---
    if (!/^\+7\d{10}$/.test(phone)) {
      console.error('[CORPORATE] Invalid phone format:', phone);

      return NextResponse.json(
        {
          success: false,
          error: 'Некорректный номер телефона. Ожидается формат +7xxxxxxxxxx',
          debug: { phone },
        },
        { status: 400 }
      );
    }

    // --- Email ---
    if (!/\S+@\S+\.\S+/.test(email)) {
      console.error('[CORPORATE] Invalid email format:', email);

      return NextResponse.json(
        { success: false, error: 'Некорректный email', debug: { email } },
        { status: 400 }
      );
    }

    // --- Сохраняем заявку в БД ---
    try {
      const saved = await prisma.corporate_requests.create({
        data: {
          name,
          company: company || null,
          phone,
          email,
          message: message || null,
          created_at: new Date(),
        },
      });

      console.log('[CORPORATE] Saved to DB with id:', saved.id);
    } catch (dbError: any) {
      console.error('[CORPORATE] Prisma error:', dbError);

      return NextResponse.json(
        {
          success: false,
          error:
            'Ошибка сохранения заявки в базе данных: ' + dbError.message,
        },
        { status: 500 }
      );
    }

    // --- Проверка наличия Telegram-конфига ---
    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error(
        '[CORPORATE] Telegram env missing',
        'TELEGRAM_TOKEN:',
        TELEGRAM_TOKEN ? 'SET' : 'EMPTY',
        'TELEGRAM_CHAT_ID:',
        TELEGRAM_CHAT_ID ? 'SET' : 'EMPTY'
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Телеграм не настроен: отсутствует TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID или CORPORATE_* переменные.',
          debug: {
            TELEGRAM_TOKEN_SET: !!TELEGRAM_TOKEN,
            TELEGRAM_CHAT_ID_SET: !!TELEGRAM_CHAT_ID,
          },
        },
        { status: 500 }
      );
    }

    const telegramMessage = `
<b>🔔 Новая заявка с корпоративной страницы</b>
<b>Имя:</b> ${escapeHtml(name || '—')}
<b>Компания:</b> ${escapeHtml(company || 'Не указана')}
<b>Телефон:</b> ${escapeHtml(phone || '—')}
<b>E-mail:</b> ${escapeHtml(email || '—')}
<b>Сообщение:</b> ${escapeHtml(message || 'Нет')}
    `.trim();

    console.log('[CORPORATE] Sending Telegram message...');
    console.log(
      '[CORPORATE] Using bot token (first 10 chars):',
      TELEGRAM_TOKEN.slice(0, 10) + '...',
      'chat_id:',
      TELEGRAM_CHAT_ID
    );

    // --- Отправка в Telegram ---
    const tgRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramMessage,
          parse_mode: 'HTML',
        }),
      }
    );

    const tgText = await tgRes.text();

    if (!tgRes.ok) {
      console.error(
        '[CORPORATE] Telegram error status:',
        tgRes.status,
        'body:',
        tgText
      );

      // ❗ НА ВСЯКИЙ СЛУЧАЙ – НЕ СЧИТАЕМ ЭТО УСПЕХОМ, ЧТОБЫ ТЫ УВИДЕЛ ОШИБКУ В NETWORK
      return NextResponse.json(
        {
          success: false,
          error: 'Ошибка отправки уведомления в Telegram',
          telegramStatus: tgRes.status,
          telegramResponse: tgText,
        },
        { status: 500 }
      );
    }

    console.log('[CORPORATE] Telegram message sent OK, status:', tgRes.status);

    return NextResponse.json({
      success: true,
      telegramStatus: tgRes.status,
      telegramResponse: tgText,
    });
  } catch (e: any) {
    console.error(
      '[CORPORATE] Server error at',
      new Date().toISOString(),
      ':',
      e
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'Произошла ошибка при обработке заявки: ' + (e?.message || e),
      },
      { status: 500 }
    );
  }
}
