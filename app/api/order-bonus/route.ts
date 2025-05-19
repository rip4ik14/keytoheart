import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';
import type { Database } from '@/lib/supabase/types_new';

// Уровни кешбэка
const CASHBACK_LEVELS = [
  { level: 'bronze', percentage: 2.5, minTotal: 0 },
  { level: 'silver', percentage: 5, minTotal: 10000 },
  { level: 'gold', percentage: 7.5, minTotal: 20000 },
  { level: 'platinum', percentage: 10, minTotal: 30000 },
  { level: 'premium', percentage: 15, minTotal: 50000 },
];

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+7' + digits;
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '+7' + digits.slice(-10);
  }
  return raw.startsWith('+') ? raw : '+' + raw;
}

export async function POST(request: Request) {
  try {
    const { phone: rawPhone, order_total, order_id } = await request.json();

    if (typeof rawPhone !== 'string' || typeof order_total !== 'number' || !order_id) {
      return NextResponse.json(
        { success: false, error: 'Неверные входные данные' },
        { status: 400 }
      );
    }

    const phone = normalizePhone(
      sanitizeHtml(rawPhone, { allowedTags: [], allowedAttributes: {} })
    );

    if (!/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона' },
        { status: 400 }
      );
    }
    if (order_total < 0) {
      return NextResponse.json(
        { success: false, error: 'Некорректная сумма заказа' },
        { status: 400 }
      );
    }

    // Пытаемся получить существующую запись
    let { data: bonusRecord, error: getErr } = await supabase
      .from('bonuses')
      .select('id, bonus_balance, level, total_spent, total_bonus')
      .eq('phone', phone)
      .single();

    // Если не нашли — создаём
    if (getErr || !bonusRecord) {
      const { data: newRow, error: insertErr } = await supabase
        .from('bonuses')
        .insert({
          phone,
          bonus_balance: 0,
          level: 'bronze',
          total_spent: 0,
          total_bonus: 0,
          updated_at: new Date().toISOString(),
        })
        .select('id, bonus_balance, level, total_spent, total_bonus')
        .single();

      if (insertErr || !newRow) {
        return NextResponse.json(
          { success: false, error: 'Ошибка создания бонусной записи: ' + insertErr?.message },
          { status: 500 }
        );
      }
      bonusRecord = newRow;
    }

    const prevBalance = bonusRecord.bonus_balance ?? 0;
    const prevSpent   = bonusRecord.total_spent   ?? 0;
    const prevBonus   = bonusRecord.total_bonus   ?? 0;

    const newTotalSpent = prevSpent + order_total;
    const levelObj = CASHBACK_LEVELS
      .slice().reverse()
      .find((lvl) => newTotalSpent >= lvl.minTotal)!
      || CASHBACK_LEVELS[0];

    const bonusToAdd = Math.floor(order_total * (levelObj.percentage / 100));
    const newBalance   = prevBalance + bonusToAdd;
    const newTotalBonus = prevBonus + bonusToAdd;

    // Обновляем запись
    const { error: updateErr } = await supabase
      .from('bonuses')
      .update({
        bonus_balance: newBalance,
        level: levelObj.level,
        total_spent: newTotalSpent,
        total_bonus: newTotalBonus,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', phone);

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: 'Ошибка обновления бонусов: ' + updateErr.message },
        { status: 500 }
      );
    }

    // Логируем историю начисления
    await supabase
      .from('bonus_history')
      .insert({
        bonus_id: bonusRecord.id,
        amount: bonusToAdd,
        reason: `Начисление за заказ #${order_id}`,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      bonus_added: bonusToAdd,
      new_balance: newBalance,
      new_level: levelObj.level,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + err.message },
      { status: 500 }
    );
  }
}
