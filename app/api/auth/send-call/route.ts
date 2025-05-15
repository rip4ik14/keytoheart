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

    // Проверяем попытки авторизации
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('auth_logs')
      .select('created_at')
      .eq('phone', formattedPhone)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (attemptsError) {
      console.error('Error checking auth_logs:', attemptsError);
      return NextResponse.json({ success: false, error: 'Ошибка проверки попыток' }, { status: 500 });
    }

    if (recentAttempts && recentAttempts.length >= 5) {
      console.error(`Too many attempts for phone: ${formattedPhone}`);
      return NextResponse.json({ success: false, error: 'Слишком много попыток' }, { status: 429 });
    }

    // Отправляем запрос на звонок через SMS.ru
    const url = `https://sms.ru/callcheck/send?api_id=${SMS_RU_API_ID}&phone=${formattedPhone}&json=1`;
    console.log(`Sending request to SMS.ru: ${url}`);
    const apiRes = await fetch(url);
    const apiJson = await apiRes.json();
    console.log('SMS.ru response:', apiJson);

    if (!apiJson || apiJson.status !== 'OK') {
      console.error('SMS.ru API error:', apiJson?.status_text || 'Unknown error');
      return NextResponse.json({ success: false, error: 'Ошибка отправки звонка' }, { status: 500 });
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
      console.error('Error inserting auth_logs:', insertError);
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
    console.error('Error in send-call:', error);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}
