import { supabasePublic as supabase } from "@/lib/supabase/public";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { code } = await req.json();

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, message: 'Промокод не найден' });
  }

  const now = new Date();

  if (!data.is_active) {
    return NextResponse.json({ valid: false, message: 'Промокод отключён' });
  }

  if (data.expires_at && new Date(data.expires_at) < now) {
    return NextResponse.json({ valid: false, message: 'Срок действия истёк' });
  }

  if (data.max_uses && data.used_count >= data.max_uses) {
    return NextResponse.json({ valid: false, message: 'Лимит использований исчерпан' });
  }

  return NextResponse.json({ valid: true, discount: data.discount });
}
