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
  const phone = searchParams.get('phone');

  if (!checkId || !phone) {
    console.error('Missing parameters: checkId or phone', { checkId, phone });
    return NextResponse.json({ success: false, error: 'checkId and phone required' }, { status: 400 });
  }

  try {
    console.log(`[${new Date().toISOString()}] Fetching status for checkId: ${checkId}, phone: ${phone}`);

    // Сначала проверяем статус в auth_logs
    const { data: logData, error: logError } = await supabase
      .from('auth_logs')
      .select('status')
      .eq('check_id', checkId)
      .single();

    if (logError) {
      console.error(`[${new Date().toISOString()}] Error fetching auth_logs:`, logError);
    }

    if (logData && logData.status === 'VERIFIED') {
      console.log(`[${new Date().toISOString()}] Status already VERIFIED in auth_logs for checkId: ${checkId}`);
      return NextResponse.json({ success: true, status: 'VERIFIED' });
    }

    // Если статус не VERIFIED, проверяем в SMS.ru
    const url = `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&phone=${encodeURIComponent(phone)}&check_id=${encodeURIComponent(checkId)}&json=1`;
    console.log(`[${new Date().toISOString()}] Calling SMS.ru API: ${url}`);
    const startTime = Date.now();
    const apiRes = await fetch(url);
    const apiJson = await apiRes.json();
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] SMS.ru API response (duration: ${duration}ms):`, apiJson);

    if (!apiJson || apiJson.status !== 'OK') {
      console.error('SMS.ru API error:', apiJson?.status_text || 'Unknown error');
      return NextResponse.json({ success: false, error: 'Ошибка проверки статуса звонка' }, { status: 500 });
    }

    // Приводим check_status к строке для надёжного сравнения
    const checkStatus = String(apiJson.check_status);

    if (checkStatus === '401') {
      // Номер подтверждён, обновляем статус в auth_logs
      const { error: updateError } = await supabase
        .from('auth_logs')
        .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
        .eq('check_id', checkId);

      if (updateError) {
        console.error('Error updating auth_logs:', updateError);
        return NextResponse.json({ success: false, error: 'Ошибка обновления статуса в базе данных' }, { status: 500 });
      }

      console.log(`[${new Date().toISOString()}] Status updated to VERIFIED for checkId ${checkId}`);
      return NextResponse.json({ success: true, status: 'VERIFIED' });
    } else if (checkStatus === '402') {
      console.log(`[${new Date().toISOString()}] CheckId ${checkId} expired`);
      return NextResponse.json({ success: false, status: 'EXPIRED', error: 'Время для звонка истекло' });
    } else {
      console.log(`[${new Date().toISOString()}] CheckId ${checkId} still pending, status: ${checkStatus}`);
      return NextResponse.json({ success: false, status: 'PENDING', error: 'Номер ещё не подтверждён. Совершите звонок.' });
    }
  } catch (error: any) {
    console.error('Error checking call status:', error);
    return NextResponse.json({ success: false, status: 'ERROR', error: 'Серверная ошибка' }, { status: 500 });
  }
}
