import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: true, persistSession: false } }
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

    // Проверяем количество попыток за последние 24 часа
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('auth_logs')
      .select('created_at')
      .eq('phone', cleanPhone)
      .gte('created_at', cutoffDate);

    if (attemptsError) {
      console.error('Error checking auth_logs:', attemptsError);
      return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
    }

    const recentAttemptsCount = recentAttempts.length;
    console.log(`Found ${recentAttemptsCount} recent attempts for phone: ${cleanPhone}`);

    if (recentAttemptsCount >= 5) {
      console.error(`Too many attempts for phone: ${cleanPhone}`);
      window.gtag?.('event', 'auth_attempt_limit', { event_category: 'auth', phone: cleanPhone });
      window.ym?.(12345678, 'reachGoal', 'auth_attempt_limit');
      return NextResponse.json({ success: false, error: 'Слишком много попыток' }, { status: 429 });
    }

    // Отправляем запрос на звонок через SMS.ru
    const url = `https://sms.ru/callcheck/add?api_id=${SMS_RU_API_ID}&phone=${cleanPhone}&json=1`;
    console.log(`Sending request to SMS.ru: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Тайм-аут 10 секунд

    const apiRes = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const responseText = await apiRes.text();
    console.log('SMS.ru raw response:', responseText);

    if (!apiRes.ok) {
      console.error(`SMS.ru returned non-OK status: ${apiRes.status} ${apiRes.statusText}`);
      console.error('Raw response:', responseText);
      return NextResponse.json({ success: false, error: 'Ошибка ответа от SMS.ru' }, { status: 500 });
    }

    let apiJson;
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

    // Сохраняем или обновляем лог авторизации
    const { error: upsertError } = await supabase
      .from('auth_logs')
      .upsert(
        {
          phone: cleanPhone,
          check_id: apiJson.check_id,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'check_id' } // Исправлено: строка вместо массива
      );

    if (upsertError) {
      console.error('Error upserting auth_logs:', upsertError);
      return NextResponse.json({ success: false, error: 'Ошибка записи в базу данных' }, { status: 500 });
    }

    console.log(`Successfully sent call request for phone: ${cleanPhone}`);
    window.gtag?.('event', 'auth_call_initiated', { event_category: 'auth', phone: cleanPhone });
    window.ym?.(12345678, 'reachGoal', 'auth_call_initiated');
    return NextResponse.json({
      success: true,
      check_id: apiJson.check_id,
      call_phone: apiJson.call_phone,
      call_phone_pretty: apiJson.call_phone_pretty,
    });
  } catch (error: any) {
    console.error('Error in send-call:', error.message);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}