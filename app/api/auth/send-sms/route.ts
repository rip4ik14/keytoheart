import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const smsApiId = process.env.SMS_RU_API_ID || '';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^(\+7|7|8)\d{10}$/.test(phone.replace(/[^0-9]/g, ''))) {
      console.error('Invalid phone format:', phone);
      return NextResponse.json({ success: false, error: 'Введите корректный номер в формате +7' }, { status: 400 });
    }

    // Ограничение по частоте
    const { data: recentLog } = await supabase
      .from('auth_logs')
      .select('*')
      .eq('phone', phone)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (recentLog && recentLog.updated_at) {
      const now = new Date();
      const last = new Date(recentLog.updated_at);
      if ((now.getTime() - last.getTime()) < 60000) {
        console.log('Rate limit exceeded for phone:', phone);
        return NextResponse.json({ success: false, error: 'Запросите код повторно через минуту.' }, { status: 429 });
      }
    }

    // Проверка количества попыток
    const { count } = await supabase
      .from('auth_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone);
    if ((count || 0) >= 5) {
      console.log('Too many attempts for phone:', phone);
      return NextResponse.json({
        success: false,
        error: 'Превышено число попыток. Попробуйте снова через 10 минут или используйте WhatsApp.',
      }, { status: 429 });
    }

    const code = generateCode();
    const text = `Код подтверждения: ${code}`;
    const params = new URLSearchParams();
    params.append('api_id', smsApiId);
    params.append('to', phone.replace('+', ''));
    params.append('msg', text);
    params.append('json', '1');

    const resp = await fetch('https://sms.ru/sms/send', {
      method: 'POST',
      body: params,
    });

    const data = await resp.json();
    console.log('SMS.ru send response:', data);

    if (data.status !== 'OK') {
      console.error('SMS.ru send error:', data.status_text);
      return NextResponse.json({ success: false, error: 'Не удалось отправить SMS. Попробуйте позже.' }, { status: 500 });
    }

    // Устанавливаем expires_at через 10 минут от текущего времени
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    console.log('Setting expires_at:', expiresAt.toISOString());

    // Сохраняем код в Supabase
    const { error: insertError } = await supabase.from('sms_codes').insert({
      phone,
      code,
      used: false,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Error inserting SMS code:', insertError);
      return NextResponse.json({ success: false, error: 'Ошибка сохранения кода' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Server error in send-sms:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
