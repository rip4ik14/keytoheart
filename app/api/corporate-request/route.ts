import { NextResponse } from "next/server";
import { supabasePublic as supabase } from '@/lib/supabase/public';

const TOKEN = process.env.CORPORATE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CORPORATE_TELEGRAM_CHAT_ID;

export async function POST(req: Request) {
  try {
    // Получаем данные из формы
    const body = await req.json();
    const { name, company, phone, email, message } = body;

    // Проверяем обязательные поля
    if (!name || !phone || !email) {
      console.error('Validation error: Missing required fields', { name, phone, email });
      return NextResponse.json(
        { success: false, error: "Пожалуйста, заполните все обязательные поля." },
        { status: 400 }
      );
    }

    // Сохраняем заявку в Supabase
    console.log('Inserting into corporate_requests:', { name, company, phone, email, message });
    const { error: dbError } = await supabase
      .from('corporate_requests')
      .insert([
        {
          name,
          company: company || null,
          phone,
          email,
          message: message || null,
        },
      ]);

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.json(
        { success: false, error: "Ошибка сохранения заявки в базе данных: " + dbError.message },
        { status: 500 }
      );
    }

    // Отправляем уведомление в Telegram (опционально)
    if (TOKEN && CHAT_ID) {
      const telegramMessage = `
  <b>🔔 Новая заявка с корпоративной страницы</b>
  <b>Имя:</b> ${name || "—"}
  <b>Компания:</b> ${company || "Не указана"}
  <b>Телефон:</b> ${phone || "—"}
  <b>E-mail:</b> ${email || "—"}
  <b>Сообщение:</b> ${message || "Нет"}
      `.trim();

      console.log('Sending Telegram message:', telegramMessage);
      const tgRes = await fetch(
        `https://api.telegram.org/bot${TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: telegramMessage,
            parse_mode: "HTML",
          }),
        }
      );

      if (!tgRes.ok) {
        const err = await tgRes.text();
        console.error('Telegram error:', err);
        console.warn('Continuing despite Telegram error');
      } else {
        console.log('Telegram notification sent successfully');
      }
    } else {
      console.warn('Corporate Telegram bot token or chat ID not set, skipping Telegram notification');
    }

    console.log('Successfully processed corporate request');
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Server error:', e);
    return NextResponse.json(
      { success: false, error: "Произошла ошибка при обработке заявки: " + e.message },
      { status: 500 }
    );
  }
}