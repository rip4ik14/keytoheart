// ✅ Путь: app/api/auth/send-call/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const smsApiId = process.env.SMS_RU_API_ID || '';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^(\+7|7|8)\d{10}$/.test(phone.replace(/[^0-9]/g, ''))) {
      return NextResponse.json({ success: false, error: 'Введите корректный номер в формате +7' }, { status: 400 });
    }

    // Привести к формату +7
    let normalized = phone.replace(/[^0-9]/g, '');
    if (normalized.startsWith('8')) normalized = '7' + normalized.slice(1);
    if (!normalized.startsWith('7')) normalized = '7' + normalized;
    const phoneNum = `+${normalized}`;

    // Ограничение по частоте (блокируем частые запросы)
    const { data: recentLog } = await supabase
      .from('auth_logs')
      .select('*')
      .eq('phone', phoneNum)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (recentLog && recentLog.updated_at) {
      const now = new Date();
      const last = new Date(recentLog.updated_at);
      if ((now.getTime() - last.getTime()) < 60000) {
        return NextResponse.json({ success: false, error: 'Запросите код повторно через минуту.' }, { status: 429 });
      }
    }

    // ---- ВНИМАНИЕ: Правильный эндпоинт и параметры ----
    const params = new URLSearchParams();
    params.append('api_id', smsApiId);
    params.append('phone', normalized);
    params.append('json', '1');

    const resp = await fetch('https://sms.ru/callcheck/add', {
      method: 'POST',
      body: params,
    });

    const data = await resp.json();

    if (data.status !== 'OK' || !data.check_id) {
      return NextResponse.json({ success: false, error: data.status_text || 'Не удалось инициировать звонок.' }, { status: 500 });
    }

    // Логируем попытку
    await supabase
      .from('auth_logs')
      .upsert({ phone: phoneNum, check_id: data.check_id, status: 'SENT', updated_at: new Date().toISOString() });

    // Сбрасываем счетчик попыток
    await supabase
      .from('auth_codes')
      .delete()
      .eq('phone', phoneNum);

    return NextResponse.json({
      success: true,
      check_id: data.check_id,
      call_phone: data.call_phone,
      call_phone_pretty: data.call_phone_pretty,
    });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
