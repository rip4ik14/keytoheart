// ✅ Исправленный: app/api/auth/send-call/route.ts (без ограничения на попытки)
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

    // Временно убираем проверку количества попыток
    /*
    let recentAttemptsCount = 0;
    try {
      console.log(`Querying auth_logs with phone: ${formattedPhone}`);

      const { data: recentAttempts, error: attemptsError } = await supabase
        .from('auth_logs')
        .select('created_at')
        .eq('phone', formattedPhone);

      if (attemptsError) {
        console.error('Error checking auth_logs:', attemptsError.message, attemptsError.details);
        console.error('Full error object:', JSON.stringify(attemptsError, null, 2));
      } else {
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        recentAttemptsCount = recentAttempts
          ? recentAttempts.filter((attempt) => {
              if (!attempt.created_at) {
                console.warn(`Found record with null created_at for phone: ${formattedPhone}`);
                return false;
              }
              return new Date(attempt.created_at) >= cutoffDate;
            }).length
          : 0;
        console.log(`Found ${recentAttemptsCount} recent attempts for phone: ${formattedPhone}`);
      }

      if (recentAttemptsCount >= 5) {
        console.error(`Too many attempts for phone: ${formattedPhone}`);
        return NextResponse.json({ success: false, error: 'Слишком много попыток' }, { status: 429 });
      }
    } catch (error: any) {
      console.error('Unexpected error while checking auth_logs:', error.message, error.stack);
    }
    */

    // Отправляем запрос на звонок через SMS.ru (используем /callcheck/add)
    const url = `https://sms.ru/callcheck/add?api_id=${SMS_RU_API_ID}&phone=${formattedPhone}&json=1`;
    console.log(`Sending request to SMS.ru: ${url}`);

    let apiJson;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Тайм-аут 10 секунд

      const apiRes = await fetch(url, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const responseText = await apiRes.text();
      console.log('SMS.ru raw response:', responseText);

      if (!apiRes.ok) {
        console.error(`SMS.ru returned non-OK status: ${apiRes.status} ${apiRes.statusText}`);
        console.error('Raw response:', responseText);
        return NextResponse.json({ success: false, error: 'Ошибка ответа от SMS.ru' }, { status: 500 });
      }

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
        return NextResponse.json({ success: false, error: 'Ошибка отправки звонка' }, { status: 500 });
      }
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        console.error('Request to SMS.ru timed out after 10 seconds');
        return NextResponse.json({ success: false, error: 'Превышено время ожидания ответа от SMS.ru' }, { status: 500 });
      }
      console.error('Error fetching from SMS.ru:', fetchError.message, fetchError.stack);
      return NextResponse.json({ success: false, error: 'Ошибка связи с SMS.ru' }, { status: 500 });
    }

    // Сохраняем лог авторизации
    const { error: insertError } = await supabase
      .from('auth_logs')
      .insert({
        phone: formattedPhone,
        check_id: apiJson.check_id,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting auth_logs:', insertError.message, insertError.details);
      console.error('Full error object:', JSON.stringify(insertError, null, 2));
      return NextResponse.json({ success: false, error: 'Ошибка записи в базу данных' }, { status: 500 });
    }

    console.log(`Successfully sent call request for phone: ${formattedPhone}`);
    return NextResponse.json({
      success: true,
      check_id: apiJson.check_id,
      call_phone: apiJson.call_phone,
      call_phone_pretty: apiJson.call_phone_pretty,
    });
  } catch (error: any) {
    console.error('Error in send-call:', error.message, error.stack);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}