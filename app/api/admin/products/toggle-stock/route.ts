import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  const { id } = await req.json();

  // 1. Создаем клиент Supabase
  const supabase = await createSupabaseServerClient();

  // 2. Получаем текущий товар
  const { data: product, error: getError } = await supabase
    .from('products')
    .select('id, in_stock')
    .eq('id', id)
    .single();

  if (getError || !product) {
    return NextResponse.json({ error: getError?.message || 'Товар не найден' }, { status: 500 });
  }

  // 3. Инвертируем in_stock
  const newStatus = !product.in_stock;

  // 4. Обновляем статус
  const { data, error } = await supabase
    .from('products')
    .update({ in_stock: newStatus })
    .eq('id', id)
    .select('id, in_stock')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 5. Инвалидируем кэш для товаров
  revalidateTag('products');

  return NextResponse.json({ success: true, product: data });
}