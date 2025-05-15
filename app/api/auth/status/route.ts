import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkId = searchParams.get('checkId');
  const phone = searchParams.get('phone'); // Добавляем phone как параметр

  if (!checkId || !phone) {
    return NextResponse.json({ success: false, error: 'checkId and phone required' }, { status: 400 });
  }

  try {
    // Проверяем статус в SMS.ru
    const url = `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&phone=${encodeURIComponent(phone)}&check_id=${encodeURIComponent(checkId)}&json=1`;
    const apiRes = await fetch(url);
    const apiJson = await apiRes.json();

    console.log('SMS.ru status response:', apiJson);

    if (!apiJson || apiJson.status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Ошибка проверки статуса звонка' }, { status: 500 });
    }

    if (apiJson.check_status === '401') {
      // Номер подтверждён, обновляем статус в auth_logs
      await supabase
        .from('auth_logs')
        .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
        .eq('check_id', checkId);

      return NextResponse.json({ success: true, status: 'VERIFIED' });
    } else if (apiJson.check_status === '402') {
      // Время истекло
      return NextResponse.json({ success: false, status: 'EXPIRED', error: 'Время для звонка истекло' });
    } else {
      // Номер ещё не подтверждён
      return NextResponse.json({ success: false, status: 'PENDING', error: 'Номер ещё не подтверждён. Совершите звонок.' });
    }
  } catch (error: any) {
    console.error('Error checking call status:', error);
    return NextResponse.json({ success: false, status: 'ERROR', error: 'Серверная ошибка' }, { status: 500 });
  }
}
