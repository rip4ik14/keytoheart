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

    // Проверка формата номера (только РФ)
    if (!phone || !/^(\+7|7|8)\d{10}$/.test(phone.replace(/[^0-9]/g, ''))) {
      return NextResponse.json({ success: false, error: 'Введите корректный номер в формате +7' }, { status: 400 });
    }

    // Привести к формату 7988xxxxxxx (для API sms.ru)
    let normalized = phone.replace(/[^0-9]/g, '');
    if (normalized.startsWith('8')) normalized = '7' + normalized.slice(1);
    if (!normalized.startsWith('7')) normalized = '7' + normalized;
    const phoneNum = `+${normalized}`; // Для логирования и базы

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
      if ((now.getTime() - last.getTime()) < 60000) { // Меньше минуты назад
        return NextResponse.json({ success: false, error: 'Запросите код повторно через минуту.' }, { status: 429 });
      }
    }

    // --- Инициация звонка через SMS.ru ---
    // https://sms.ru/callcheck/add?api_id=...&phone=7988...&json=1
    const apiUrl = `https://sms.ru/callcheck/add?api_id=${smsApiId}&phone=${normalized}&json=1`;
    const apiResp = await fetch(apiUrl, { method: 'GET' });
    const apiData = await apiResp.json();

    // Расширенный лог ошибок для дебага
    if (apiData.status !== 'OK' || !apiData.check_id) {
      return NextResponse.json({
        success: false,
        error: apiData.status_text || 'Не удалось отправить звонок. Попробуйте позже.',
        debug: apiData
      }, { status: 500 });
    }

    // Логируем попытку
    await supabase
      .from('auth_logs')
      .upsert({ phone: phoneNum, check_id: apiData.check_id, status: 'SENT', updated_at: new Date().toISOString() });

    // Сбрасываем счетчик попыток
    await supabase
      .from('auth_codes')
      .delete()
      .eq('phone', phoneNum);

    // Вернуть номер, на который надо звонить, и check_id (frontend покажет этот номер пользователю!)
    return NextResponse.json({
      success: true,
      check_id: apiData.check_id,
      call_phone: apiData.call_phone, // например, 78005008275
      call_phone_pretty: apiData.call_phone_pretty, // например, +7 (800) 500-8275
      call_phone_html: apiData.call_phone_html
    });
  } catch (e: any) {
    console.error('Ошибка в send-call:', e);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}
