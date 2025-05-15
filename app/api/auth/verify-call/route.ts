import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';
import jwt from 'jsonwebtoken';

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
      console.error('Missing parameters:', { phone, check_id, code });
      return NextResponse.json({ success: false, error: 'phone, check_id, and code required' }, { status: 400 });
    }

    // Проверяем код через SMS.ru
    const url = `https://sms.ru/code/check?api_id=${SMS_RU_API_ID}&call_id=${check_id}&code=${code}`;
    console.log(`Calling SMS.ru API: ${url}`);
    const startTime = Date.now();
    const apiRes = await fetch(url);
    const responseText = await apiRes.text();
    const duration = Date.now() - startTime;
    console.log(`SMS.ru API response (duration: ${duration}ms):`, responseText);

    // Парсим текстовый ответ SMS.ru
    const lines = responseText.trim().split('\n');
    console.log('SMS.ru response lines:', lines);

    if (lines[0] !== '100') {
      console.error('SMS.ru verification failed:', lines[0], lines.slice(1).join(' '));
      return NextResponse.json({ success: false, error: 'Неверный код' }, { status: 400 });
    }

    // Код подтверждён, обновляем статус в auth_logs
    const { error: updateError } = await supabase
      .from('auth_logs')
      .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
      .eq('check_id', check_id);

    if (updateError) {
      console.error('Error updating auth_logs:', updateError);
      return NextResponse.json({ success: false, error: 'Ошибка обновления статуса в базе данных' }, { status: 500 });
    }

    // Создаём JWT-токен
    const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });

    // Устанавливаем cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 дней
      path: '/',
    });

    console.log(`[${new Date().toISOString()}] Successfully verified call for phone: ${phone}`);
    return response;
  } catch (error: any) {
    console.error('Error verifying call:', error);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}
