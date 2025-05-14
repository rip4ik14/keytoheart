import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const SMSRU_API_ID = process.env.SMSRU_API_ID!;
const JWT_SECRET = process.env.JWT_SECRET!;
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { phone, checkId } = await request.json();
    if (!phone || !checkId) {
      return NextResponse.json({ success: false, error: 'Phone and checkId are required' }, { status: 400 });
    }

    // Проверка статуса звонка
    const smsResponse = await fetch(
      `https://sms.ru/callcheck/status?api_id=${SMSRU_API_ID}&check_id=${checkId}&json=1`
    );
    const result = await smsResponse.json();

    if (result.status !== 'OK' || result.check_status !== '401') {
      return NextResponse.json({ success: false, error: 'Call not verified yet' }, { status: 400 });
    }

    // Обновляем auth_logs
    await supabase.from('auth_logs').upsert({
      check_id: checkId,
      phone,
      status: 'verified',
      updated_at: new Date().toISOString(),
    });

    // Получаем имя пользователя
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('phone', phone)
      .single();

    // Получаем бонусный баланс
    const { data: bonuses } = await supabase
      .from('bonuses')
      .select('bonus_balance')
      .eq('phone', phone)
      .single();

    const name = profile?.name || '';
    const bonusBalance = bonuses?.bonus_balance || 0;

    // Создаём JWT и куку
    const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });

    const nextResponse = NextResponse.json({ success: true, name, bonusBalance });

    nextResponse.cookies.set('auth_token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return nextResponse;
  } catch (error: any) {
    console.error('Error verifying call:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
