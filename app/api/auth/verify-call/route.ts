import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;
const JWT_SECRET = process.env.JWT_SECRET!;
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { phone, check_id, code } = await request.json();

    if (!phone || !check_id || !code) {
      return NextResponse.json({ success: false, error: 'Данные не заполнены' }, { status: 400 });
    }

    if (!phone.startsWith('+7')) {
      return NextResponse.json({ success: false, error: 'Доступно только для российских номеров' }, { status: 400 });
    }

    // Проверка кода через SMS.ru
    const url = `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&phone=${encodeURIComponent(phone)}&check_id=${encodeURIComponent(check_id)}&json=1`;
    const apiRes = await fetch(url);
    const apiJson = await apiRes.json();

    console.log('SMS.ru verify response:', apiJson);

    if (!apiJson || apiJson.status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Ошибка проверки звонка' }, { status: 500 });
    }

    if (apiJson.check_status !== '401') {
      return NextResponse.json({ success: false, error: 'Номер ещё не подтверждён. Совершите звонок.' }, { status: 400 });
    }

    if (apiJson.code !== code) {
      // Логируем попытку
      await supabase.from('auth_codes').insert({ phone, code, used: false });
      return NextResponse.json({ success: false, error: 'Неверный код' }, { status: 400 });
    }

    // Код верный, очищаем попытки
    await supabase.from('auth_codes').delete().eq('phone', phone);

    // Обновляем статус в auth_logs
    await supabase
      .from('auth_logs')
      .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
      .eq('check_id', check_id);

    // Генерируем JWT-токен
    const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });
    const response = NextResponse.json({ success: true, phone });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (e: any) {
    console.error('Ошибка в verify-call:', e);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}
