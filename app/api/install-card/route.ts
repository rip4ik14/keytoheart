import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json();

    if (!user_id || !/^\+7\d{10}$/.test(user_id)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
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

    if (!bonusRecord) {
      const { data: newBonus, error: insertErr } = await supabase
        .from('bonuses')
        .insert({
          phone: user_id,
          bonus_balance: 0,
          level: 'bronze',
          total_spent: 0,
          total_bonus: 0,
          updated_at: new Date().toISOString(),
        })
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

    // Проверяем, не были ли бонусы уже начислены за установку карты
    const { data: historyCheck, error: historyErr } = await supabase
      .from('bonus_history')
      .select('id')
      .eq('bonus_id', bonusRecord.id)
      .eq('reason', 'Бонус за установку карты клиента');

    if (historyErr) {
      console.error('Error checking bonus history:', historyErr);
      return NextResponse.json(
        { success: false, error: 'Ошибка проверки истории бонусов: ' + historyErr.message },
        { status: 500 }
      );
    }

    if (historyCheck && historyCheck.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Бонусы за установку карты уже начислены' },
        { status: 400 }
      );
    }

    // Начисляем 300 бонусов
    const bonusToAdd = 300;
    const newBalance = (bonusRecord.bonus_balance || 0) + bonusToAdd;

    const { error: updateErr } = await supabase
      .from('bonuses')
      .update({
        bonus_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', user_id);

    if (updateErr) {
      console.error('Error updating bonus balance:', updateErr);
      return NextResponse.json(
        { success: false, error: 'Ошибка начисления бонусов: ' + updateErr.message },
        { status: 500 }
      );
    }

    // Записываем историю начисления
    const { error: historyInsertErr } = await supabase
      .from('bonus_history')
      .insert({
        bonus_id: bonusRecord.id,
        amount: bonusToAdd,
        reason: 'Бонус за установку карты клиента',
        created_at: new Date().toISOString(),
      });

    if (historyInsertErr) {
      console.error('Error logging bonus history:', historyInsertErr);
      // Продолжаем выполнение, но логируем ошибку
    }

    return NextResponse.json({
      success: true,
      bonus_added: bonusToAdd,
      new_balance: newBalance,
    });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
