import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types_new';

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload: id and status are required' },
        { status: 400 }
      );
    }

    // Проверяем права админа
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (adminError || !admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can update order status' },
        { status: 403 }
      );
    }

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
    if (order.status === 'completed' && status === 'completed') {
      return NextResponse.json(
        { error: 'Order already completed, bonuses already accrued' },
        { status: 400 }
      );
    }

    // Обновляем статус заказа
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    // Начисляем бонусы, если статус стал completed
    if (status === 'completed' && order.bonus > 0) {
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