import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { user_id, order_total, order_id } = await request.json();

    if (!user_id || !/^\+7\d{10}$/.test(user_id)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }
    if (typeof order_total !== 'number' || order_total < 0) {
      return NextResponse.json(
        { success: false, error: 'Некорректная сумма заказа' },
        { status: 400 }
      );
    }
    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'Отсутствует ID заказа' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь в bonuses
    let { data: bonusRecord, error: getErr } = await supabase
      .from('bonuses')
      .select('id, bonus_balance')
      .eq('phone', user_id)
      .single();

    if (getErr && getErr.code !== 'PGRST116') {
      console.error('Error fetching bonus record:', getErr);
      return NextResponse.json(
        { success: false, error: 'Ошибка получения бонусов: ' + getErr.message },
        { status: 500 }
      );
    }

    // Если записи нет, создаём новую
    if (!bonusRecord) {
      const { data: newBonus, error: insertErr } = await supabase
        .from('bonuses')
        .insert({ phone: user_id, bonus_balance: 0, level: 'basic' })
        .select('id, bonus_balance')
        .single();

      if (insertErr) {
        console.error('Error creating bonus record:', insertErr);
        return NextResponse.json(
          { success: false, error: 'Ошибка создания бонусов: ' + insertErr.message },
          { status: 500 }
        );
      }
      bonusRecord = newBonus;
    }

    // Начисляем бонусы (2.5% от суммы заказа)
    const bonusToAdd = Math.floor(order_total * 0.025);
    const newBalance = (bonusRecord.bonus_balance || 0) + bonusToAdd;

    // Обновляем баланс бонусов
    const { error: updateErr } = await supabase
      .from('bonuses')
      .update({ bonus_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('phone', user_id);

    if (updateErr) {
      console.error('Error updating bonus balance:', updateErr);
      return NextResponse.json(
        { success: false, error: 'Ошибка начисления бонусов: ' + updateErr.message },
        { status: 500 }
      );
    }

    // Записываем историю начисления
    const { error: historyErr } = await supabase
      .from('bonus_history')
      .insert({
        bonus_id: bonusRecord.id,
        amount: bonusToAdd,
        reason: `Начисление за заказ #${order_id}`,
        created_at: new Date().toISOString(),
      });

    if (historyErr) {
      console.error('Error logging bonus history:', historyErr);
      // Не прерываем выполнение, но логируем ошибку
    }

    return NextResponse.json({ success: true, bonus_added: bonusToAdd, new_balance: newBalance });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
