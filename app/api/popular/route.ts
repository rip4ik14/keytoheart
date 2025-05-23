import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Серверная ошибка: отсутствуют настройки Supabase' },
      { status: 500 }
    );
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        original_price,
        discount_percent,
        in_stock,
        images,
        is_popular,
        is_visible,
        order_index
      `)
      .eq('in_stock', true)
      .eq('is_popular', true)
      .eq('is_visible', true)
      .order('order_index', { ascending: true })
      .limit(10);

    if (error) {
      return NextResponse.json(
        { error: 'Ошибка загрузки популярных товаров из базы данных', details: error.message },
        { status: 500 }
      );
    }

    const formattedData = (data || []).map(product => ({
      ...product,
      images: Array.isArray(product.images) && product.images.length > 0 ? [product.images[0]] : [],
    }));

    return NextResponse.json(formattedData, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Неожиданная ошибка сервера', details: err.message || 'Нет деталей' },
      { status: 500 }
    );
  }
}

export const revalidate = 60;
