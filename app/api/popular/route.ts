// ✅ Путь: app/api/popular/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables');
    return NextResponse.json(
      { error: 'Серверная ошибка: отсутствуют настройки Supabase' },
      { status: 500 }
    );
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const start = Date.now();

    // Получаем ID категорий для исключения (balloons, cards)
    const { data: excludedCategories, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .in('slug', ['balloons', 'cards']);

    if (categoryError) {
      console.error('Supabase error fetching excluded categories:', categoryError);
      return NextResponse.json(
        { error: 'Ошибка загрузки категорий', details: categoryError.message },
        { status: 500 }
      );
    }

    const excludedCategoryIds = excludedCategories.map((cat) => cat.id);

    // Получаем product_id, исключая запрещённые категории и "Без категории"
    const { data: productCategoryData, error: productCategoryError } = await supabase
      .from('product_categories')
      .select('product_id')
      .not('category_id', 'in', `(${excludedCategoryIds.join(',')})`)
      .neq('category_id', 38); // Исключаем категорию "Без категории"

    if (productCategoryError) {
      console.error('Supabase error fetching product categories:', productCategoryError);
      return NextResponse.json(
        { error: 'Ошибка загрузки товаров', details: productCategoryError.message },
        { status: 500 }
      );
    }

    const productIds = productCategoryData.map((item) => item.product_id);

    // Запрашиваем популярные товары
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
      .in('id', productIds)
      .eq('in_stock', true)
      .eq('is_popular', true)
      .eq('is_visible', true)
      .order('order_index', { ascending: true })
      .limit(10);

    console.log('Supabase query duration in /api/popular:', Date.now() - start, 'ms');

    if (error) {
      console.error('Supabase error in /api/popular:', error);
      return NextResponse.json(
        { error: 'Ошибка загрузки популярных товаров', details: error.message },
        { status: 500 }
      );
    }

    const formattedData = data.map((product) => ({
      ...product,
      images: Array.isArray(product.images)
        ? product.images.map((img) =>
            img.includes('example.com')
              ? 'https://via.placeholder.com/300x300?text=Product+Image'
              : img
          )
        : [],
    }));

    return NextResponse.json(formattedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https://*.supabase.co https://via.placeholder.com;",
      },
    });
  } catch (err: any) {
    console.error('Unexpected error in /api/popular:', err);
    return NextResponse.json(
      { error: 'Неожиданная ошибка сервера', details: err.message || 'Нет деталей' },
      { status: 500 }
    );
  }
}

export const revalidate = 60;