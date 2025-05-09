import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';

export async function POST(req: Request) {
  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ valid: false, message: 'Код промокода обязателен' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .select('id, discount, is_active, expires_at, max_uses, used_count')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, message: 'Промокод не найден' }, { status: 400 });
  }

  const now = new Date();
  if (!data.is_active) {
    return NextResponse.json({ valid: false, message: 'Промокод отключён' }, { status: 400 });
  }

  if (data.expires_at && new Date(data.expires_at) < now) {
    return NextResponse.json({ valid: false, message: 'Срок действия истёк' }, { status: 400 });
  }

  if (data.max_uses && data.used_count >= data.max_uses) {
    return NextResponse.json({ valid: false, message: 'Лимит использований исчерпан' }, { status: 400 });
  }

  return NextResponse.json({ valid: true, discount: data.discount });
}