// ✅ Путь: app/api/promo/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/promo/validate: Starting request');
    const body = await req.json();
    console.log('POST /api/promo/validate: Received payload:', body);

    const { code } = body;
    if (!code) {
      console.log('POST /api/promo/validate: Missing code');
      return NextResponse.json({ error: 'Код промокода обязателен' }, { status: 400 });
    }

    console.log('POST /api/promo/validate: Validating promo code:', code);
    const { data: promo, error } = await supabaseAdmin
      .from('promo_codes')
      .select('id, discount_value, discount_type, is_active, expires_at, max_uses, used_count')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !promo || !promo.is_active) {
      console.log('POST /api/promo/validate: Promo code invalid or inactive:', code);
      return NextResponse.json({ error: 'Промокод недействителен' }, { status: 400 });
    }

    const now = new Date();
    if (promo.expires_at && new Date(promo.expires_at) < now) {
      console.log('POST /api/promo/validate: Promo code expired:', code, 'Expires at:', promo.expires_at);
      return NextResponse.json({ error: 'Срок действия промокода истёк' }, { status: 400 });
    }

    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      console.log('POST /api/promo/validate: Promo code usage limit reached:', code);
      return NextResponse.json({ error: 'Промокод исчерпан' }, { status: 400 });
    }

    console.log('POST /api/promo/validate: Promo code validated:', promo);
    return NextResponse.json({
      success: true,
      discount: promo.discount_value,
      discountType: promo.discount_type,
      promoId: promo.id,
    });
  } catch (error: any) {
    console.error('POST /api/promo/validate: Error:', error);
    return NextResponse.json(
      { error: 'Ошибка проверки промокода: ' + error.message },
      { status: 500 }
    );
  }
}