import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { user_id, amount, order_id } = await request.json();

    console.log('Attempting to redeem bonuses:', { user_id, amount, order_id });

    if (!user_id || !/^\+7\d{10}$/.test(user_id)) {
      console.error('Invalid phone number:', user_id);
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }
    if (typeof amount !== 'number' || amount < 0) {
      console.error('Invalid amount:', amount);
      return NextResponse.json(
        { success: false, error: 'Некорректная сумма' },
        { status: 400 }
      );
    }

    // Получаем текущий баланс, списываем только если хватает
    const { data, error: getErr } = await supabase
      .from('bonuses')
      .select('id, bonus_balance')
      .eq('phone', user_id)
      .single();

    if (getErr || !data || typeof data.bonus_balance !== 'number') {
      console.error('Error fetching bonus balance:', getErr?.message);
      return NextResponse.json(
        { success: false, error: 'Бонусы не найдены' },
        { status: 400 }
      );
    }
    if (data.bonus_balance < amount) {
      console.error('Insufficient bonuses:', { current_balance: data.bonus_balance, requested_amount: amount });
      return NextResponse.json(
        { success: false, error: 'Недостаточно бонусов' },
        { status: 400 }
      );
    }

    const newBalance = data.bonus_balance - amount;

    // Обновляем баланс бонусов
    const { error: updateErr } = await supabase
      .from('bonuses')
      .update({ bonus_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('phone', user_id);

    if (updateErr) {
      console.error('Error updating bonus balance:', updateErr);
      return NextResponse.json(
        { success: false, error: 'Ошибка списания: ' + updateErr.message },
        { status: 500 }
      );
    }

    // Записываем историю списания
    const { error: historyErr } = await supabase
      .from('bonus_history')
      .insert({
        bonus_id: data.id,
        amount: -amount,
        reason: `Списание за заказ #${order_id}`,
        created_at: new Date().toISOString(),
      });

    if (historyErr) {
      console.error('Error logging bonus history:', historyErr);
      // Продолжаем выполнение, но логируем ошибку
    }

    console.log('Successfully redeemed bonuses:', { user_id, amount, new_balance: newBalance });
    return NextResponse.json({ success: true, balance: newBalance });
  } catch (error: any) {
    console.error('Server error in redeem-bonus:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
