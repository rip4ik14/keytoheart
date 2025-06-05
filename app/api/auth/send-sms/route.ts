// app/api/auth/send-sms/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

// используем any, чтобы убрать ошибки по неописанным в Database таблицам
const supabase = createClient<any>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Введите номер телефона' }, { status: 400 });
    }

    // Очищаем всё, кроме цифр
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 11 || !clean.startsWith('7') || !/^[7]9\d{9}$/.test(clean)) {
      return NextResponse.json({ success: false, error: 'Введите корректный номер в формате +7' }, { status: 400 });
    }

    // Ограничение по количеству попыток за последние 10 минут
    const MAX = 20;
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const sb = supabase as any;

    const { data: recent, error: e1 } = await sb
      .from('auth_logs')
      .select('created_at')
      .eq('phone', clean)
      .gte('created_at', since);

    if (e1) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка при проверке auth_logs:', e1);
    }
    if (Array.isArray(recent) && recent.length >= MAX) {
      return NextResponse.json({ success: false, error: 'Слишком много попыток' }, { status: 429 });
    }

    // Отправка SMS через SMS.ru
    const url = `https://sms.ru/sms/send?api_id=${SMS_RU_API_ID}&to=${clean}&msg=${encodeURIComponent(
      'Ваш код для входа: 1234'
    )}&json=1`;

    const apiRes = await fetch(url);
    const text = await apiRes.text();
    let apiJson: any;
    try {
      apiJson = JSON.parse(text);
    } catch {
      process.env.NODE_ENV !== "production" && console.error('Невалидный ответ SMS.ru:', text);
      return NextResponse.json({ success: false, error: 'Ошибка ответа от SMS-сервиса' }, { status: 500 });
    }

    if (apiJson.status !== 'OK') {
      process.env.NODE_ENV !== "production" && console.error('Ошибка SMS.ru:', apiJson);
      return NextResponse.json({ success: false, error: 'Ошибка отправки SMS' }, { status: 500 });
    }

    // Логируем попытку в auth_logs
    const { error: e2 } = await sb
      .from('auth_logs')
      .insert({
        phone: clean,
        check_id: apiJson.check_id || `sms-${Date.now()}`,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    if (e2) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка записи в auth_logs:', e2);
    }

    return NextResponse.json({ success: true, check_id: apiJson.check_id || null });
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('send-sms error:', err);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}
