// ✅ Путь: app/api/upsell/products/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL || 'https://gwbeabfkknhewwoesqax.supabase.co';

function getSupabase() {
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * GET /api/upsell/products?category_id=8
 * GET /api/upsell/products?subcategory_id=173
 * GET /api/upsell/products?category_id=8&subcategory_id=173
 * GET /api/upsell/products?category_id=8&subcategory_id=173,171
 */
export async function GET(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not defined' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);

  const categoryIdRaw = searchParams.get('category_id');
  const subcategoryIdRaw = searchParams.get('subcategory_id');

  // Разрешаем любой из параметров, но не оба пустые
  if (!categoryIdRaw && !subcategoryIdRaw) {
    return NextResponse.json(
      { success: false, error: 'Нужен category_id и/или subcategory_id' },
      { status: 400 },
    );
  }

  const categoryId = categoryIdRaw ? Number(categoryIdRaw) : null;

  const subcategoryIds = (subcategoryIdRaw || '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));

  if (categoryIdRaw && !Number.isFinite(categoryId)) {
    return NextResponse.json(
      { success: false, error: 'Некорректный category_id' },
      { status: 400 },
    );
  }

  if (subcategoryIdRaw && subcategoryIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Некорректный subcategory_id' },
      { status: 400 },
    );
  }

  try {
    let finalProductIds: number[] = [];

    // 1) Если есть category_id - берём product_id из product_categories
    let categoryProductIds: number[] = [];
    if (Number.isFinite(categoryId)) {
      const { data: catRows, error: catErr } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', categoryId as number);

      if (catErr) throw catErr;
      categoryProductIds = (catRows || []).map((r: any) => r.product_id).filter(Boolean);
    }

    // 2) Если есть subcategory_id - берём product_id из product_subcategories
    let subcategoryProductIds: number[] = [];
    if (subcategoryIds.length > 0) {
      const { data: subRows, error: subErr } = await supabase
        .from('product_subcategories')
        .select('product_id')
        .in('subcategory_id', subcategoryIds);

      if (subErr) throw subErr;
      subcategoryProductIds = (subRows || []).map((r: any) => r.product_id).filter(Boolean);
    }

    // 3) Определяем итоговый набор
    if (categoryProductIds.length > 0 && subcategoryProductIds.length > 0) {
      // пересечение
      const subSet = new Set(subcategoryProductIds);
      finalProductIds = categoryProductIds.filter((id) => subSet.has(id));
    } else if (categoryProductIds.length > 0) {
      // только категория
      finalProductIds = categoryProductIds;
    } else if (subcategoryProductIds.length > 0) {
      // только подкатегории
      finalProductIds = subcategoryProductIds;
    } else {
      // есть параметры, но связей нет
      return NextResponse.json(
        { success: true, data: [] },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } },
      );
    }

    // Убираем дубли на всякий
    finalProductIds = Array.from(new Set(finalProductIds));

    if (finalProductIds.length === 0) {
      return NextResponse.json(
        { success: true, data: [] },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } },
      );
    }

    // 4) Тянем продукты + фильтры видимости/наличия
    const { data: items, error: prodErr } = await supabase
      .from('products')
      .select('id, title, price, image_url, images, in_stock, is_visible')
      .in('id', finalProductIds)
      .eq('is_visible', true)
      .eq('in_stock', true)
      .order('id', { ascending: false });

    if (prodErr) throw prodErr;

    const formatted = (items || []).map((item: any) => ({
      id: String(item.id),
      title: item.title,
      price: item.price,
      image_url:
        item.image_url ||
        (Array.isArray(item.images) && item.images[0] ? item.images[0] : '/placeholder.jpg'),
    }));

    return NextResponse.json(
      { success: true, data: formatted },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Неожиданная ошибка сервера',
        details: err?.message || String(err),
      },
      { status: 500 },
    );
  }
}

// ⚠️ В route handlers revalidate не работает как в page.tsx,
// но оставлять не мешает. Кэш мы контролируем через Cache-Control.
export const revalidate = 300;
