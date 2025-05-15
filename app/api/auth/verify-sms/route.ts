import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';
import jwt from 'jsonwebtoken';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'Данные не заполнены' }, { status: 400 });
    }

    if (!phone.startsWith('+7')) {
      return NextResponse.json({ success: false, error: 'Доступно только для российских номеров' }, { status: 400 });
    }

    // Проверка кода в Supabase
    const { data, error } = await supabase
      .from('sms_codes')
      .select('*')
      .eq('phone', phone)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data || !data.code) {
      return NextResponse.json({ success: false, error: 'Код не найден или истёк' }, { status: 400 });
    }

    // Проверка срока действия кода
    if (data.expires_at) {
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      if (now > expiresAt) {
        return NextResponse.json({ success: false, error: 'Код истёк' }, { status: 400 });
      }
    }

    if (data.code !== code) {
      // Логируем попытку
      await supabase.from('auth_codes').insert({ phone, code, used: false });
      return NextResponse.json({ success: false, error: 'Неверный код' }, { status: 400 });
    }

    // Помечаем код как использованный
    await supabase
      .from('sms_codes')
      .update({ used: true })
      .eq('phone', phone)
      .eq('code', code);

    // Код верный, очищаем попытки
    await supabase.from('auth_codes').delete().eq('phone', phone);

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
    console.error('Ошибка в verify-sms:', e);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}
