import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkId = searchParams.get('checkId');
  const phone = searchParams.get('phone');

  if (!checkId || !phone) {
    console.error('Missing checkId or phone in query parameters');
    return NextResponse.json({ success: false, error: 'checkId and phone required' }, { status: 400 });
  }

  // Проверяем формат номера
  if (!phone.startsWith('+7') || phone.replace(/\D/g, '').length !== 11) {
    console.error('Invalid phone format:', phone);
    return NextResponse.json({ success: false, error: 'Некорректный номер телефона' }, { status: 400 });
  }

  try {
    const url = `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`;
    console.log(`Calling SMS.ru API: ${url}`);
    const startTime = Date.now();
    const apiRes = await fetch(url);
    const responseText = await apiRes.text();
    const duration = Date.now() - startTime;
    console.log(`SMS.ru API response (duration: ${duration}ms):`, responseText);

    let apiJson;
    try {
      apiJson = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error('Failed to parse SMS.ru response as JSON:', parseError.message);
      console.error('Raw response:', responseText);
      return NextResponse.json({ success: false, error: 'Ошибка ответа от SMS.ru' }, { status: 500 });
    }

    if (!apiJson || apiJson.status !== 'OK') {
      console.error('SMS.ru API error:', apiJson?.status_text || 'Unknown error');
      return NextResponse.json({ success: false, error: 'Ошибка проверки статуса' }, { status: 500 });
    }

    const checkStatus = apiJson.check_status;
    const checkStatusText = apiJson.check_status_text;

    if (checkStatus === '401') {
      // Номер подтверждён
      const { error: updateError } = await supabase
        .from('auth_logs')
        .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
        .eq('check_id', checkId);

      if (updateError) {
        console.error('Error updating auth_logs:', updateError);
        return NextResponse.json({ success: false, error: 'Ошибка обновления статуса в базе данных' }, { status: 500 });
      }

      return NextResponse.json({ success: true, status: 'VERIFIED' });
    } else if (checkStatus === '402') {
      // Время истекло
      return NextResponse.json({ success: false, status: 'EXPIRED', error: 'Время для звонка истекло' });
    } else {
      // Ожидаем звонка
      return NextResponse.json({ success: true, status: 'PENDING', message: checkStatusText });
    }
  } catch (error: any) {
    console.error('Error checking call status:', error);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}
