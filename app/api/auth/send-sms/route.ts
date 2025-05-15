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
  const { phone } = await request.json();

  // Проверка попыток
  const { count } = await supabase
    .from('auth_codes')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone);
  if ((count || 0) >= 5) {
    return NextResponse.json({
      success: false,
      error: 'Превышено число попыток. Авторизоваться можно будет через 10 минут или оформите заказ через WhatsApp.'
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

  if (data.status !== 'OK') {
    return NextResponse.json({ success: false, error: 'Не удалось отправить смс. Попробуйте позже.' }, { status: 500 });
  }

  // Сохраняем код для проверки
  await supabase.from('auth_codes').insert({ phone, code, used: false });

  return NextResponse.json({ success: true });
}
