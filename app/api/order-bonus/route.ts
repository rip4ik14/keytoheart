import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';

interface OrderBonusResponse {
  success: boolean;
  bonusAmount?: number;
  error?: string;
}

export async function POST(req: Request) {
  const { user_id, order_total, order_id } = await req.json();

  if (!user_id || !order_total || order_total <= 0) {
    return NextResponse.json({ error: 'Отсутствует user_id или order_total' }, { status: 400 });
  }

  const percent = 0.05;
  const bonusAmount = Math.floor(order_total * percent);

  // Вызываем функцию increment_balance_and_log
  const { data: rpcData, error: rpcError } = await supabase.rpc('increment_balance_and_log', {
    p_user_id: user_id,
    p_amount: bonusAmount,
    p_reason: `Начисление за заказ №${order_id || 'без номера'}`,
  });

  if (rpcError) {
    console.error('RPC error:', rpcError);
    return NextResponse.json({ success: false, error: 'Ошибка начисления бонусов: ' + rpcError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, bonusAmount } as OrderBonusResponse, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}