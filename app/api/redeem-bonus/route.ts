import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';

interface RedeemBonusResponse {
  success: boolean;
  error?: string;
}

export async function POST(req: Request) {
  const { user_id, amount, order_id } = await req.json();

  if (!user_id || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
  }

  const { data: profile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('bonus_balance')
    .eq('id', user_id)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Профиль не найден' }, { status: 404 });
  }

  // Проверяем bonus_balance, заменяя null на 0
  const balance = profile.bonus_balance ?? 0;
  if (balance < amount) {
    return NextResponse.json({ error: 'Недостаточно бонусов' }, { status: 400 });
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('decrement_balance_and_log', {
    p_user_id: user_id,
    p_amount: amount,
    p_reason: `Списание бонусов за заказ №${order_id ?? 'без номера'}`,
  });

  if (rpcError || !rpcData) {
    return NextResponse.json({ success: false, error: 'Ошибка списания бонусов' }, { status: 500 });
  }

  return NextResponse.json({ success: true } as RedeemBonusResponse);
}