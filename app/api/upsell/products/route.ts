// ✅ Путь: app/api/upsell/products/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://gwbeabfkknhewwoesqax.supabase.co';

// We require SUPABASE_SERVICE_ROLE_KEY at runtime. If it's missing, the handler
// will return an error response instead of using a fallback token.
function getSupabase() {
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not defined' },
      { status: 500 }
    );
  }
  process.env.NODE_ENV !== "production" && console.log('GET /api/upsell/products: Request received');
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('category_id');
  const subcategoryId = searchParams.get('subcategory_id');

  process.env.NODE_ENV !== "production" && console.log('GET /api/upsell/products: Query params:', { categoryId, subcategoryId });

  if (!categoryId || !subcategoryId) {
    process.env.NODE_ENV !== "production" && console.log('GET /api/upsell/products: Missing parameters');
    return NextResponse.json(
      { success: false, error: 'Отсутствуют параметры category_id или subcategory_id' },
      { status: 400 }
    );
  }

  try {
    process.env.NODE_ENV !== "production" && console.log('GET /api/upsell/products: Fetching items from Supabase...');

    // Запрашиваем товары из таблицы products, фильтруя по category_id и subcategory_id
    const { data: productIdsFromCategories, error: categoryError } = await supabase
      .from('product_categories')
      .select('product_id')
      .eq('category_id', parseInt(categoryId));

    if (categoryError) {
      process.env.NODE_ENV !== "production" && console.error('GET /api/upsell/products: Category query error:', categoryError);
      throw categoryError;
    }

    const { data: productIdsFromSubcategories, error: subcategoryError } = await supabase
      .from('product_subcategories')
      .select('product_id')
      .eq('subcategory_id', parseInt(subcategoryId));

    if (subcategoryError) {
      process.env.NODE_ENV !== "production" && console.error('GET /api/upsell/products: Subcategory query error:', subcategoryError);
      throw subcategoryError;
    }

    // Находим пересечение product_id, которые есть и в категории, и в подкатегории
    const categoryProductIds = productIdsFromCategories.map((item) => item.product_id);
    const subcategoryProductIds = productIdsFromSubcategories.map((item) => item.product_id);
    const commonProductIds = categoryProductIds.filter((id) => subcategoryProductIds.includes(id));

    process.env.NODE_ENV !== "production" && console.log('GET /api/upsell/products: Common product IDs:', commonProductIds);

    if (commonProductIds.length === 0) {
      process.env.NODE_ENV !== "production" && console.log('GET /api/upsell/products: No matching products found');
      return NextResponse.json(
        { success: true, data: [] },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' } }
      );
    }

    // Запрашиваем товары из таблицы products
    const { data: items, error: productsError } = await supabase
      .from('products')
      .select('id, title, price, image_url, images')
      .in('id', commonProductIds);

    if (productsError) {
      process.env.NODE_ENV !== "production" && console.error('GET /api/upsell/products: Products query error:', productsError);
      throw productsError;
    }

    process.env.NODE_ENV !== "production" && console.log('GET /api/upsell/products: Items fetched:', items);

    if (!items || items.length === 0) {
      process.env.NODE_ENV !== "production" && console.log('GET /api/upsell/products: No items found');
      return NextResponse.json(
        { success: true, data: [] },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' } }
      );
    }

    const formattedItems = items.map((item) => ({
      id: item.id.toString(),
      title: item.title,
      price: item.price,
      image_url: item.image_url || (item.images && item.images.length > 0 ? item.images[0] : '/placeholder.jpg'),
    }));

    process.env.NODE_ENV !== "production" && console.log('GET /api/upsell/products: Formatted items:', formattedItems);

    return NextResponse.json(
      { success: true, data: formattedItems },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' } }
    );
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('GET /api/upsell/products: Error:', err);
    return NextResponse.json(
      { success: false, error: 'Неожиданная ошибка сервера', details: err.message },
      { status: 500 }
    );
  }
}

export const revalidate = 3600;