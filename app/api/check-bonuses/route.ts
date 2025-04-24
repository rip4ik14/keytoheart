// Путь: app/api/check-bonuses/route.ts

import { NextResponse } from "next/server";
import { supabasePublic as supabase } from "@/lib/supabase/public"; // единый публичный клиент

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json(
      { success: false, error: "Не указан номер" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("bonuses")
    .select("bonus_balance")
    .eq("phone", phone)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, bonus_balance: 0 });
  }

  return NextResponse.json({ success: true, bonus_balance: data.bonus_balance });
}
