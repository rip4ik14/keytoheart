import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase/public';

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('Received request body:', body);

  const { code } = body;
  if (!code) {
    console.log('Error: Code is missing');
    return NextResponse.json({ error: 'Код промокода обязателен' }, { status: 400 });
  }

  console.log('Fetching promo code:', code);
  const { data: promo, error } = await supabasePublic
    .from('promo_codes')
    .select('id, discount, discount_type, is_active, expires_at, max_uses, used_count')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error || !promo) {
    console.log('Error fetching promo:', error || 'No promo found');
    return NextResponse.json({ error: 'Промокод недействителен' }, { status: 400 });
  }

  console.log('Promo found:', promo);

  const now = new Date();
  if (promo.expires_at && new Date(promo.expires_at) < now) {
    console.log('Promo expired:', promo.expires_at);
    return NextResponse.json({ error: 'Срок действия промокода истёк' }, { status: 400 });
  }

  if (promo.max_uses && promo.used_count >= promo.max_uses) {
    console.log('Promo usage limit reached:', { used: promo.used_count, max_uses: promo.max_uses });
    return NextResponse.json({ error: 'Промокод исчерпан' }, { status: 400 });
  }

  console.log('Promo validated successfully:', promo);
  return NextResponse.json({
    success: true,
    discount: promo.discount,
    discountType: promo.discount_type, // Добавили тип скидки
    promoId: promo.id,
  });
}