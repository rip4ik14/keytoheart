// Путь: app/api/bonuses/route.ts

import { NextResponse } from "next/server";
import { supabasePublic as supabase } from "@/lib/supabase/public"; // ← публичный singleton

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json(
      { success: false, error: "Телефон не указан" },
      { status: 400 }
    );
  }

  // Берём баланс и уровень
  const { data: bonusData, error: bonusError } = await supabase
    .from("bonuses")
    .select("bonus_balance, level")
    .eq("phone", phone)
    .single();

  if (bonusError || !bonusData) {
    return NextResponse.json({ success: false, data: null });
  }

  // Берём историю операций
  const { data: history } = await supabase
    .from("bonus_history")
    .select("amount, reason, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    success: true,
    data: {
      bonus_balance: bonusData.bonus_balance,
      level: bonusData.level,
      history: history || [],
    },
  });
}
