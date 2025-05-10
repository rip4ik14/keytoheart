import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    // Проверка формата номера телефона
    if (!phone || phone.length !== 12 || !phone.startsWith('+7')) {
      return NextResponse.json({ success: false, error: 'Некорректный номер телефона' }, { status: 400 });
    }

    // Проверка кода
    const { data: authCode, error: dbError } = await supabase
      .from('auth_codes')
      .select('code, created_at, used')
      .eq('phone', phone)
      .eq('used', false) // Проверяем только неиспользованные коды
      .single();

    if (dbError || !authCode) {
      return NextResponse.json({ success: false, error: 'Код не найден или уже использован' }, { status: 400 });
    }

    // Проверка срока действия кода (5 минут)
    if (!authCode.created_at) {
      return NextResponse.json({ success: false, error: 'Код не имеет даты создания' }, { status: 400 });
    }
    const codeAge = (new Date().getTime() - new Date(authCode.created_at).getTime()) / 1000 / 60;
    if (codeAge > 5) {
      return NextResponse.json({ success: false, error: 'Код истёк' }, { status: 400 });
    }

    if (authCode.code !== code) {
      return NextResponse.json({ success: false, error: 'Неверный код' }, { status: 400 });
    }

    // Помечаем код как использованный
    await supabase.from('auth_codes').update({ used: true }).eq('phone', phone);

    // Проверяем, существует ли профиль
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('phone', phone)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Ошибка при проверке профиля:', fetchError);
      return NextResponse.json({ success: false, error: 'Ошибка проверки профиля' }, { status: 500 });
    }

    let profile;
    if (existingProfile) {
      // Обновляем существующий профиль
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({ name: "EMPTY", updated_at: new Date().toISOString() })
        .eq('phone', phone)
        .select('name')
        .single();

      if (updateError) {
        console.error('Ошибка обновления профиля:', updateError);
        return NextResponse.json({ success: false, error: 'Ошибка обновления профиля: ' + updateError.message }, { status: 500 });
      }
      profile = data;
    } else {
      // Создаём новый профиль
      const { data, error: insertError } = await supabase
        .from('user_profiles')
        .insert({ phone, name: "EMPTY", updated_at: new Date().toISOString(), created_at: new Date().toISOString(), bonus_balance: 0 })
        .select('name')
        .single();

      if (insertError) {
        console.error('Ошибка создания профиля:', insertError);
        return NextResponse.json({ success: false, error: 'Ошибка создания профиля: ' + insertError.message }, { status: 500 });
      }
      profile = data;
    }

    // Получаем бонусный баланс
    const { data: bonusData, error: bonusError } = await supabase
      .from('bonuses')
      .select('bonus_balance')
      .eq('phone', phone)
      .single();

    const bonusBalance = bonusError || !bonusData ? 0 : bonusData.bonus_balance;

    return NextResponse.json({
      success: true,
      profile: { name: profile.name },
      bonusBalance,
    });
  } catch (error) {
    console.error('Ошибка верификации SMS:', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}