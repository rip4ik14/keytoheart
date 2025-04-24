// Путь: app/api/toggle-stock/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server"; // ← singleton с service-role key

export async function POST(req: NextRequest) {
  const { id, in_stock } = await req.json();

  const { error } = await supabaseAdmin
    .from("products")
    .update({ in_stock })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true });
}
