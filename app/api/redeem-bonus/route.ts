import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+7' + digits;
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8')))
    return '+7' + digits.slice(-10);
  return raw.startsWith('+') ? raw : '+' + raw;
}

export async function POST(request: Request) {
  try {
    const { phone: rawPhone, amount, order_id } = await request.json();

    if (typeof rawPhone !== 'string' || typeof amount !== 'number' || !order_id) {
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
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }
    if (amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Некорректная сумма' },
        { status: 400 }
      );
    }

    const { data: bonusRow, error: fetchErr } = await supabase
      .from('bonuses')
      .select('id, bonus_balance')
      .eq('phone', phone)
      .single();

    if (fetchErr || !bonusRow) {
      return NextResponse.json(
        { success: false, error: 'Бонусы не найдены для этого номера' },
        { status: 404 }
      );
    }

    const currentBalance = bonusRow.bonus_balance ?? 0;
    if (currentBalance < amount) {
      return NextResponse.json(
        { success: false, error: 'Недостаточно бонусов' },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - amount;
    const { error: updateErr } = await supabase
      .from('bonuses')
      .update({ bonus_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('phone', phone);

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: 'Ошибка при списании бонусов: ' + updateErr.message },
        { status: 500 }
      );
    }

    await supabase
      .from('bonus_history')
      .insert({
        bonus_id: bonusRow.id,
        amount: -amount,
        reason: `Списание за заказ #${order_id}`,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + err.message },
      { status: 500 }
    );
  }
}
