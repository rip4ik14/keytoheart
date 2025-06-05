import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Итоговый тип, который мы возвращаем на фронт (для автокомплита)
interface PopularProduct {
  id: number;
  title: string;
  price: number | null;
  original_price: number | null;
  discount_percent: number | null;
  in_stock: boolean | null;
  images: string[];
  is_popular: boolean | null;
  is_visible: boolean | null;
  order_index: number | null;
}

export async function GET() {
  try {
    // Получаем товары из Supabase
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, title, price, original_price, discount_percent, in_stock, images, is_popular, is_visible, order_index')
      .eq('in_stock', true)
      .eq('is_popular', true)
      .eq('is_visible', true)
      .order('order_index', { ascending: true })
      .limit(10);

    if (error) {
      process.env.NODE_ENV !== "production" && console.error('Supabase error fetching popular products:', error);
      return NextResponse.json(
        { error: 'Ошибка получения популярных товаров: ' + error.message },
        { status: 500 }
      );
    }

    // Приводим все поля к правильным типам
    const formattedData: PopularProduct[] = (data || []).map((product: any) => ({
      id: product.id,
      title: product.title,
      price: product.price !== null ? Number(product.price) : null,
      original_price: product.original_price !== null ? Number(product.original_price) : null,
      discount_percent: product.discount_percent !== null ? Number(product.discount_percent) : null,
      in_stock: product.in_stock,
      images: Array.isArray(product.images)
        ? (product.images.length > 0 ? [product.images[0]] : [])
        : [],
      is_popular: product.is_popular,
      is_visible: product.is_visible,
      order_index: product.order_index !== null ? Number(product.order_index) : null,
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