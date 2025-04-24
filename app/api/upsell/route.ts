// Путь: app/api/upsell/route.ts

import { NextResponse } from "next/server";
import { supabasePublic as supabase } from "@/lib/supabase/public"; // ← используем singleton

export async function GET() {
  const { data, error } = await supabase
    .from("upsell_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
