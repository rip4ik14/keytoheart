import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const subcategoryParam = searchParams.get('subcategory');
  const subcategoriesParam = searchParams.get('subcategories');

  if (!category) {
    return NextResponse.json(
      { success: false, error: 'Отсутствует параметр category' },
      { status: 400 }
    );
  }

  // Определяем подкатегории для запроса
  let subcategories: string[] = [];
  if (subcategoriesParam) {
    subcategories = subcategoriesParam.split(',');
  } else if (subcategoryParam) {
    subcategories = [subcategoryParam];
  } else {
    return NextResponse.json(
      { success: false, error: 'Отсутствует параметр subcategory или subcategories' },
      { status: 400 }
    );
  }

  try {
    // Запрашиваем данные из таблицы upsell_items
    const startQuery = Date.now();
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('upsell_items')
      .select('id, title, price, image_url, category')
      .in('category', subcategories); // Фильтруем только по подкатегориям (cards, balloons)

    console.log('Supabase query duration for upsell_items in /api/upsell/categories:', Date.now() - startQuery, 'ms');
    console.log('Fetched upsell items:', items);

    if (itemsError) {
      console.error('Error fetching upsell items:', itemsError);
      return NextResponse.json(
        { success: false, error: 'Ошибка загрузки товаров', details: itemsError.message },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      console.log('No upsell items found for subcategories:', subcategories);
      return NextResponse.json(
        { success: true, data: [] },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' } }
      );
    }

    // Форматируем данные
    const formattedItems = items.map(item => ({
      id: item.id.toString(),
      title: item.title,
      price: item.price,
      image_url: item.image_url || '',
      category: item.category,
    }));

    return NextResponse.json(
      { success: true, data: formattedItems },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' } }
    );
  } catch (err: any) {
    console.error('Unexpected error in /api/upsell/categories:', err);
    return NextResponse.json(
      { success: false, error: 'Неожиданная ошибка сервера', details: err.message },
      { status: 500 }
    );
  }
}

export const revalidate = 3600; // Кэшируем на 1 час