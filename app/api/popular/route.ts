import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
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
    const start = Date.now();

    // Получаем связи товаров с категориями
    const { data: productCategoryData, error: productCategoryError } = await supabase
      .from('product_categories')
      .select('product_id, category_id');

    if (productCategoryError) {
      console.error('Error fetching product categories:', productCategoryError);
      return NextResponse.json(
        { error: 'Ошибка загрузки связей категорий' },
        { status: 500 }
      );
    }

    // Группируем category_ids по product_id
    const productCategoriesMap = new Map<number, number[]>();
    productCategoryData.forEach(item => {
      const existing = productCategoriesMap.get(item.product_id) || [];
      productCategoriesMap.set(item.product_id, [...existing, item.category_id]);
    });

    // Получаем категории balloon и postcard для исключения
    const { data: excludeCategories, error: excludeError } = await supabase
      .from('categories')
      .select('id')
      .in('slug', ['balloon', 'postcard']);

    const excludeCategoryIds = excludeError ? [] : (excludeCategories || []).map(cat => cat.id);

    // Получаем популярные товары
    const { data, error } = await supabase
      .from('products')
      .select('id, title, price, original_price, discount_percent, in_stock, images, order_index')
      .eq('in_stock', true)
      .eq('is_popular', true)
      .eq('is_visible', true)
      .order('order_index', { ascending: true })
      .limit(10);

    console.log('Supabase query duration in /api/popular:', Date.now() - start, 'ms');

    if (error) {
      console.error('Supabase error in /api/popular:', error);
      return NextResponse.json(
        { error: 'Ошибка загрузки популярных товаров из базы данных', details: error.message },
        { status: 500 }
      );
    }

    console.log('Raw data from Supabase:', data);

    if (!data || data.length === 0) {
      console.log('No popular products found. Conditions: in_stock=true, is_popular=true, is_visible=true');
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
      });
    }

    // Фильтруем товары, исключая balloon и postcard
    const filteredProducts = data.filter(product => {
      const categoryIds = productCategoriesMap.get(product.id) || [];
      return !categoryIds.some(id => excludeCategoryIds.includes(id));
    });

    const formattedData = filteredProducts.map(product => ({
      ...product,
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [],
      category_ids: productCategoriesMap.get(product.id) || [],
    }));

    console.log('Popular products fetched and filtered:', formattedData.length);
    console.log('Formatted data for response:', formattedData);

    return NextResponse.json(formattedData, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
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