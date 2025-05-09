import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, invalidate } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { id } = await req.json();

  // 1. Получаем текущий товар
  const { data: product, error: getError } = await supabaseAdmin
    .from('products')
    .select('id, in_stock')
    .eq('id', id)
    .single();

  if (getError || !product) {
    return NextResponse.json({ error: getError?.message || 'Товар не найден' }, { status: 500 });
  }

  // 2. Инвертируем in_stock
  const newStatus = !product.in_stock;

  // 3. Обновляем статус
  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ in_stock: newStatus })
    .eq('id', id)
    .select('id, in_stock')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidate('products');

  return NextResponse.json({ success: true, product: data });
}
