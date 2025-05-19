import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      console.error('Phone number missing');
      return NextResponse.json({ success: false, error: 'Введите номер телефона' }, { status: 400 });
    }

    console.log(`Received phone number: ${phone}`);

    // Убираем всё, кроме цифр
    const cleanPhone = phone.replace(/\D/g, '');
    console.log(`Cleaned phone number: ${cleanPhone}`);

    // Проверяем длину и формат
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('7')) {
      console.error(`Invalid phone format. Expected 11 digits starting with 7, got: ${cleanPhone}`);
      return NextResponse.json({ success: false, error: 'Введите корректный номер в формате +7' }, { status: 400 });
    }

    if (!cleanPhone.slice(1).startsWith('9')) {
      console.error(`Phone must start with 9 after country code, got: ${cleanPhone}`);
      return NextResponse.json({ success: false, error: 'Номер должен начинаться с 9 после +7' }, { status: 400 });
    }

    // Форматируем номер для SMS.ru (например, убираем +)
    const formattedPhone = cleanPhone;
    console.log(`Formatted phone for Supabase query: ${formattedPhone}`);

    // Проверяем попытки авторизации за последние 10 минут
    const MAX_ATTEMPTS = 20; // Увеличиваем лимит до 20
    const TIME_WINDOW = 10 * 60 * 1000; // 10 минут
    const cutoffDate = new Date(Date.now() - TIME_WINDOW).toISOString();

    console.log(`Querying auth_logs with phone: ${formattedPhone} for attempts after ${cutoffDate}`);
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('auth_logs')
      .select('created_at')
      .eq('phone', formattedPhone)
      .gte('created_at', cutoffDate);

    if (attemptsError) {
      console.error('Error checking auth_logs:', attemptsError.message, attemptsError.details);
      console.error('Full error object:', JSON.stringify(attemptsError, null, 2));
      // Продолжаем выполнение
    }

    const recentAttemptsCount = recentAttempts ? recentAttempts.length : 0;
    console.log(`Found ${recentAttemptsCount} recent attempts for phone: ${formattedPhone}`);

    if (recentAttemptsCount >= MAX_ATTEMPTS) {
      console.error(`Too many attempts for phone: ${formattedPhone}`);
      return NextResponse.json({ success: false, error: 'Слишком много попыток' }, { status: 429 });
    }

    // Отправляем SMS через SMS.ru
    const url = `https://sms.ru/sms/send?api_id=${SMS_RU_API_ID}&to=${formattedPhone}&msg=${encodeURIComponent('Ваш код для входа: 1234')}&json=1`;
    console.log(`Sending SMS request to SMS.ru: ${url}`);

    let apiJson;
    try {
      const apiRes = await fetch(url);
      const responseText = await apiRes.text();
      console.log('SMS.ru raw response:', responseText);

      // Проверяем, что ответ можно разобрать как JSON
      try {
        apiJson = JSON.parse(responseText);
      } catch (parseError: any) {
        console.error('Failed to parse SMS.ru response as JSON:', parseError.message);
        console.error('Raw response:', responseText);
        return NextResponse.json({ success: false, error: 'Ошибка ответа от SMS.ru' }, { status: 500 });
      }

      console.log('SMS.ru parsed response:', apiJson);

      if (!apiJson || apiJson.status !== 'OK') {
        console.error('SMS.ru API error:', apiJson?.status_text || 'Unknown error');
        return NextResponse.json({ success: false, error: 'Ошибка отправки SMS' }, { status: 500 });
      }
    } catch (fetchError: any) {
      console.error('Error fetching from SMS.ru:', fetchError.message, fetchError.stack);
      return NextResponse.json({ success: false, error: 'Ошибка связи с SMS.ru' }, { status: 500 });
    }

    // Сохраняем лог авторизации
    const { error: insertError } = await supabase
      .from('auth_logs')
      .insert({
        phone: formattedPhone,
        check_id: apiJson.check_id || `sms-${Date.now()}`, // Используем временный ID, если SMS.ru не возвращает check_id
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting auth_logs:', insertError.message, insertError.details);
      console.error('Full error object:', JSON.stringify(insertError, null, 2));
      return NextResponse.json({ success: false, error: 'Ошибка записи в базу данных' }, { status: 500 });
    }

    console.log(`Successfully sent SMS request for phone: ${formattedPhone}`);
    return NextResponse.json({
      success: true,
      check_id: apiJson.check_id || `sms-${Date.now()}`,
    });
  } catch (error: any) {
    console.error('Error in send-sms:', error.message, error.stack);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}