import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TOKEN = process.env.CORPORATE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CORPORATE_TELEGRAM_CHAT_ID;

// Функция для экранирования HTML-символов в Telegram-сообщении
const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
};

export async function POST(req: Request) {
  try {
    // Получаем данные из формы
    const body = await req.json();
    const { name, company, phone, email, message } = body;

    // Проверяем обязательные поля
    if (!name || !phone || !email) {
      process.env.NODE_ENV !== "production" && console.error('Validation error: Missing required fields', { name, phone, email });
      return NextResponse.json(
        { success: false, error: 'Пожалуйста, заполните все обязательные поля.' },
        { status: 400 }
      );
    }

    // Проверяем формат номера телефона
    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      process.env.NODE_ENV !== "production" && console.error('Invalid phone format:', phone);
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона. Ожидается формат +7xxxxxxxxxx' },
        { status: 400 }
      );
    }

    // Проверяем формат email
    if (!/\S+@\S+\.\S+/.test(email)) {
      process.env.NODE_ENV !== "production" && console.error('Invalid email format:', email);
      return NextResponse.json(
        { success: false, error: 'Некорректный email' },
        { status: 400 }
      );
    }

    // Сохраняем заявку в PostgreSQL через Prisma
    process.env.NODE_ENV !== "production" && console.log('Inserting into corporate_requests:', { name, company, phone, email, message });
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
      process.env.NODE_ENV !== "production" && console.error('Prisma error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Ошибка сохранения заявки в базе данных: ' + dbError.message },
        { status: 500 }
      );
    }

    // Отправляем уведомление в Telegram (опционально)
    if (TOKEN && CHAT_ID) {
      const telegramMessage = `
<b>🔔 Новая заявка с корпоративной страницы</b>
<b>Имя:</b> ${escapeHtml(name || '—')}
<b>Компания:</b> ${escapeHtml(company || 'Не указана')}
<b>Телефон:</b> ${escapeHtml(phone || '—')}
<b>E-mail:</b> ${escapeHtml(email || '—')}
<b>Сообщение:</b> ${escapeHtml(message || 'Нет')}
      `.trim();

      process.env.NODE_ENV !== "production" && console.log('Sending Telegram message:', telegramMessage);
      const tgRes = await fetch(
        `https://api.telegram.org/bot${TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: telegramMessage,
            parse_mode: 'HTML',
          }),
        }
      );

      if (!tgRes.ok) {
        const err = await tgRes.text();
        process.env.NODE_ENV !== "production" && console.error('Telegram error:', err, 'Status:', tgRes.status);
        process.env.NODE_ENV !== "production" && console.warn('Continuing despite Telegram error');
      } else {
        process.env.NODE_ENV !== "production" && console.log('Telegram notification sent successfully', 'Status:', tgRes.status);
      }
    } else {
      process.env.NODE_ENV !== "production" && console.warn('Corporate Telegram bot token or chat ID not set, skipping Telegram notification');
    }

    process.env.NODE_ENV !== "production" && console.log('Successfully processed corporate request at', new Date().toISOString());
    return NextResponse.json({ success: true });
  } catch (e: any) {
    process.env.NODE_ENV !== "production" && console.error('Server error at', new Date().toISOString(), ':', e);
    return NextResponse.json(
      { success: false, error: 'Произошла ошибка при обработке заявки: ' + e.message },
      { status: 500 }
    );
  }
}