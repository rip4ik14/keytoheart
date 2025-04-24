// Путь: app/api/order-bonus/route.ts

import { NextResponse } from "next/server";
import { supabasePublic as supabase } from "@/lib/supabase/public";

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, order_total, order_id } = body;

  if (!user_id || !order_total) {
    return NextResponse.json(
      { error: "Missing user_id or order_total" },
      { status: 400 }
    );
  }

  // 1. Вычисляем бонус — 5% от суммы
  const percent = 0.05; // можно потом кастомизировать по уровню
  const bonusAmount = Math.floor(order_total * percent); // округляем до целого

  // 2. Добавляем запись в bonus_history
  const { error: insertError } = await supabase
    .from("bonus_history")
    .insert([
      {
        user_id,
        amount: bonusAmount,
        reason: `Начисление за заказ №${order_id || "без номера"}`,
      },
    ]);

  // 3. Обновляем bonus_balance через RPC increment_balance
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({
      bonus_balance: supabase.rpc("increment_balance", {
        user_id,
        amount: bonusAmount,
      }),
    })
    .eq("id", user_id);

  if (insertError || updateError) {
    return NextResponse.json(
      { success: false, insertError, updateError },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, bonusAmount });
}
