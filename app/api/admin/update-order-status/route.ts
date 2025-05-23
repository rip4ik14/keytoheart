import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';
import { verifyAdminJwt } from '@/lib/auth';

const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload: id and status are required' },
        { status: 400 }
      );
    }

    // Проверка токена
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing admin session token' },
        { status: 401 }
      );
    }
    const isValidToken = await verifyAdminJwt(token);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin session token' },
        { status: 401 }
      );
    }

    // Проверяем заказ
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, phone, bonus, user_id, status')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Проверяем допустимые статусы
    const validStatuses = [
      'Ожидает подтверждения',
      'В сборке',
      'Доставляется',
      'Доставлен',
      'Отменён',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Если уже был "Доставлен", не начисляем ещё раз
    if (order.status === 'Доставлен' && status === 'Доставлен') {
      return NextResponse.json(
        { error: 'Order already completed, bonuses already accrued' },
        { status: 400 }
      );
    }

    // Обновляем статус заказа
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update order status: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Начисляем бонусы только если заказ доставлен (и был не доставлен)
    if (status === 'Доставлен' && order.status !== 'Доставлен' && order.bonus > 0) {
      if (!order.phone) {
        return NextResponse.json(
          { error: 'Cannot accrue bonuses: Order has no phone number' },
          { status: 400 }
        );
      }

      const { data: bonusData, error: bonusError } = await supabaseAdmin
        .from('bonuses')
        .select('id, bonus_balance, total_spent, level')
        .eq('phone', order.phone)
        .single();

      if (bonusError || !bonusData) {
        return NextResponse.json(
          { error: 'Failed to fetch bonus data' },
          { status: 500 }
        );
      }

      // Добавляем бонус к балансу
      const newBalance = (bonusData.bonus_balance || 0) + order.bonus;

      // (опционально) увеличиваем total_spent и пересчитываем уровень
      // Тебе надо прописать свою формулу если хочешь обновлять уровень

      const { error: balanceError } = await supabaseAdmin
        .from('bonuses')
        .update({
          bonus_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bonusData.id);

      if (balanceError) {
        return NextResponse.json(
          { error: 'Failed to update bonus balance' },
          { status: 500 }
        );
      }

      // Запись в историю
      const { error: historyError } = await supabaseAdmin
        .from('bonus_history')
        .insert({
          bonus_id: bonusData.id,
          amount: order.bonus,
          reason: `Начисление бонусов за заказ #${id}`,
          created_at: new Date().toISOString(),
          user_id: order.user_id,
        });

      if (historyError) {
        return NextResponse.json(
          { error: 'Failed to log bonus history' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Server error: ' + err.message },
      { status: 500 }
    );
  }
}
