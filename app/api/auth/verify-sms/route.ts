import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'Некорректные данные' }, { status: 400 });
    }

    // Проверяем код в Supabase
    const { data, error } = await supabase
      .from('auth_codes')
      .select('code')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('Ошибка проверки кода:', error);
      return NextResponse.json({ success: false, error: 'Код не найден' }, { status: 404 });
    }

    if (data.code !== code) {
      return NextResponse.json({ success: false, error: 'Неверный код' }, { status: 400 });
    }

    // Код верный, получаем бонусный баланс
    const { data: bonusData, error: bonusError } = await supabase
      .from('bonuses')
      .select('bonus_balance')
      .eq('phone', phone)
      .single();

    if (bonusError && bonusError.code !== 'PGRST116') { // PGRST116 - запись не найдена
      console.error('Ошибка получения бонусов:', bonusError);
      return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
    }

    // Если пользователь новый, создаём запись в bonuses
    if (!bonusData) {
      const { error: insertError } = await supabase
        .from('bonuses')
        .insert({ phone, bonus_balance: 0, total_bonus: 0, level: 'basic' });

      if (insertError) {
        console.error('Ошибка создания записи в bonuses:', insertError);
        return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      bonusBalance: bonusData?.bonus_balance ?? 0 
    });
  } catch (error) {
    console.error('Ошибка проверки SMS:', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}