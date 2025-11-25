// ✅ Путь: app/api/corporate-request/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Используем тот же бот/чат, что и для обычных заказов,
// но даём возможность переопределить отдельным корпоративным.
const TELEGRAM_TOKEN =
  process.env.CORPORATE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID =
  process.env.CORPORATE_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

interface CorporateRequestBody {
  name: string;
  company?: string;
  phone: string;
  email: string;
  message?: string;
}

// Экранирование HTML для Telegram (parse_mode: 'HTML')
const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export async function POST(req: Request) {
  try {
    // Получаем данные из формы
    const body: CorporateRequestBody = await req.json();
    const { name, company, phone, email, message } = body;

    // Проверяем обязательные поля
    if (!name || !phone || !email) {
      process.env.NODE_ENV !== 'production' &&
        console.error('Validation error: Missing required fields', {
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

    // Проверяем формат номера телефона (ожидаем +7XXXXXXXXXX)
    if (!/^\+7\d{10}$/.test(phone)) {
      process.env.NODE_ENV !== 'production' &&
        console.error('Invalid phone format:', phone);

      return NextResponse.json(
        {
          success: false,
          error: 'Некорректный номер телефона. Ожидается формат +7xxxxxxxxxx',
        },
        { status: 400 }
      );
    }

    // Проверяем формат email
    if (!/\S+@\S+\.\S+/.test(email)) {
      process.env.NODE_ENV !== 'production' &&
        console.error('Invalid email format:', email);

      return NextResponse.json(
        { success: false, error: 'Некорректный email' },
        { status: 400 }
      );
    }

    // Сохраняем заявку в PostgreSQL через Prisma
    process.env.NODE_ENV !== 'production' &&
      console.log('Inserting into corporate_requests:', {
        name,
        company,
        phone,
        email,
        message,
      });

    try {
      await prisma.corporate_requests.create({
        data: {
          name,
          company: company || null,
          phone,
          email,
          message: message || null,
          created_at: new Date(),
        },
      });
    } catch (dbError: any) {
      process.env.NODE_ENV !== 'production' &&
        console.error('Prisma error:', dbError);

      return NextResponse.json(
        {
          success: false,
          error:
            'Ошибка сохранения заявки в базе данных: ' + dbError.message,
        },
        { status: 500 }
      );
    }

    // Отправляем уведомление в Telegram
    let telegramError: string | null = null;

    if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
      const telegramMessage = `
<b>🔔 Новая заявка с корпоративной страницы</b>
<b>Имя:</b> ${escapeHtml(name || '—')}
<b>Компания:</b> ${escapeHtml(company || 'Не указана')}
<b>Телефон:</b> ${escapeHtml(phone || '—')}
<b>E-mail:</b> ${escapeHtml(email || '—')}
<b>Сообщение:</b> ${escapeHtml(message || 'Нет')}
      `.trim();

      process.env.NODE_ENV !== 'production' &&
        console.log('Sending Telegram message (corporate):', telegramMessage);

      try {
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

        if (!tgRes.ok) {
          const errText = await tgRes.text();
          telegramError = `Telegram error: ${tgRes.status} - ${errText}`;

          process.env.NODE_ENV !== 'production' &&
            console.error('[Corporate Telegram error]', telegramError);
          // Заявку в базе мы уже сохранили, поэтому не роняем ответ
        } else {
          process.env.NODE_ENV !== 'production' &&
            console.log(
              'Corporate Telegram notification sent successfully',
              'Status:',
              tgRes.status
            );
        }
      } catch (e: any) {
        telegramError = e.message;
        process.env.NODE_ENV !== 'production' &&
          console.error('[Corporate Telegram send error]', telegramError);
      }
    } else {
      process.env.NODE_ENV !== 'production' &&
        console.warn(
          'Telegram token or chat ID not set for corporate requests, skipping Telegram notification'
        );
    }

    // Возвращаем успех (заявка сохранена), даже если Telegram упал
    return NextResponse.json({
      success: true,
      telegramError,
    });
  } catch (e: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error(
        'Server error in /api/corporate-request at',
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
