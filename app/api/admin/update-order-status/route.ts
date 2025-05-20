import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

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

    // Проверяем авторизацию
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user || !user.id) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    console.log('Updating order status for user:', { id: user.id, phone: user.phone }); // Отладка

    // Проверяем существование заказа
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('phone, bonus, user_id, status')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Проверяем, был ли заказ уже завершён
    if (order.status === 'Доставлен' && status === 'Доставлен') {
      return NextResponse.json(
        { error: 'Order already completed, bonuses already accrued' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Обновляем статус заказа
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating order status:', {
        error: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      });
      return NextResponse.json(
        { error: `Failed to update order status: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Начисляем бонусы, если статус стал "Доставлен"
    if (status === 'Доставлен' && order.bonus > 0) {
      if (!order.phone) {
        console.error('Order has no associated phone number');
        return NextResponse.json(
          { error: 'Cannot accrue bonuses: Order has no phone number' },
          { status: 400 }
        );
      }

      const { data: bonusData, error: bonusError } = await supabaseAdmin
        .from('bonuses')
        .select('id, bonus_balance')
        .eq('phone', order.phone)
        .single();

      if (bonusError || !bonusData) {
        console.error('Error fetching bonuses:', bonusError);
        return NextResponse.json(
          { error: 'Failed to fetch bonus data' },
          { status: 500 }
        );
      }

      const newBalance = (bonusData.bonus_balance || 0) + order.bonus;
      const { error: balanceError } = await supabaseAdmin
        .from('bonuses')
        .update({
          bonus_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bonusData.id);

      if (balanceError) {
        console.error('Error updating bonus balance:', balanceError);
        return NextResponse.json(
          { error: 'Failed to update bonus balance' },
          { status: 500 }
        );
      }

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
        console.error('Error logging bonus history:', historyError);
        return NextResponse.json(
          { error: 'Failed to log bonus history' },
          { status: 500 }
        );
      }

      console.log(`Bonuses accrued: ${order.bonus} for order #${id}, new balance: ${newBalance}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (err: any) {
    console.error('Error in update-order-status:', err.message);
    return NextResponse.json(
      { error: 'Server error: ' + err.message },
      { status: 500 }
    );
  }
}