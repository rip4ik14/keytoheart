// Путь: app/api/redeem-bonus/route.ts

import { NextResponse } from "next/server";
// Подключаем заранее созданный синглтон
import { supabasePublic as supabase } from "@/lib/supabase/public";

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, amount, order_id } = body;

  if (!user_id || !amount || amount <= 0) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  // 1. Получаем текущий баланс
  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("bonus_balance")
    .eq("id", user_id)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  if (profile.bonus_balance < amount) {
    return NextResponse.json({ error: "Недостаточно бонусов" }, { status: 400 });
  }

  // 2. Списываем бонусы из user_profiles
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ bonus_balance: profile.bonus_balance - amount })
    .eq("id", user_id);

  // 3. Записываем в bonus_history
  const { error: insertError } = await supabase
    .from("bonus_history")
    .insert([
      {
        user_id,
        amount: -amount,
        reason: `Списание бонусов за заказ №${order_id ?? "без номера"}`,
      },
    ]);

  if (updateError || insertError) {
    console.error("Ошибка при списании бонусов:", { updateError, insertError });
    return NextResponse.json(
      { success: false, updateError, insertError },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
