import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone, amount } = await request.json();

    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }
    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Некорректная сумма' },
        { status: 400 }
      );
    }

    // Получаем текущий баланс, списываем только если хватает
    const { data, error: getErr } = await supabase
      .from('user_profiles')
      .select('bonus_balance')
      .eq('phone', phone)
      .single();

    if (getErr || !data || typeof data.bonus_balance !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Бонусы не найдены' },
        { status: 400 }
      );
    }
    if (data.bonus_balance < amount) {
      return NextResponse.json(
        { success: false, error: 'Недостаточно бонусов' },
        { status: 400 }
      );
    }

    const newBalance = data.bonus_balance - amount;

    const { error } = await supabase
      .from('user_profiles')
      .update({ bonus_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('phone', phone);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Ошибка списания: ' + error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, balance: newBalance });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
