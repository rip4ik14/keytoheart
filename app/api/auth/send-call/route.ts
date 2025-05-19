import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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

    // Проверка количества попыток
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('auth_logs')
      .select('created_at')
      .eq('phone', `+${cleanPhone}`)
      .gte('created_at', cutoffDate);

    if (attemptsError) {
      return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
    }

    if (recentAttempts.length >= 5) {
      return NextResponse.json({ success: false, error: 'Слишком много попыток' }, { status: 429 });
    }

    const smsResponse = await fetch(
      `https://sms.ru/callcheck/add?api_id=${process.env.SMS_RU_API_ID}&phone=${cleanPhone}&json=1`,
      { signal: AbortSignal.timeout(10000) }
    );
    const smsData = await smsResponse.json();

    if (!smsResponse.ok || smsData.status !== 'OK') {
      return NextResponse.json(
        { success: false, error: 'Ошибка отправки звонка' },
        { status: smsData.status_code === 203 ? 429 : 500 }
      );
    }

    const { error: upsertError } = await supabase
      .from('auth_logs')
      .upsert(
        {
          phone: `+${cleanPhone}`,
          check_id: smsData.check_id,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'check_id' }
      );

    if (upsertError) {
      return NextResponse.json({ success: false, error: 'Ошибка записи в базу данных' }, { status: 500 });
    }

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