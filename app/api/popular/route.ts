import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // Проверка переменных окружения
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json(
      { error: 'Серверная ошибка: отсутствуют настройки Supabase' },
      { status: 500 }
    );
  }

  // Инициализация Supabase клиента
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('products')
      .select('id, title, price, original_price, discount_percent, in_stock, images, category')
      .eq('in_stock', true)
      .eq('is_popular', true)
      .not('category', 'in', '(balloon,postcard)')
      .order('id', { ascending: false })
      .limit(10);
    console.log('Supabase query duration in /api/popular:', Date.now() - start, 'ms');

    if (error) {
      console.error('Supabase error in /api/popular:', error);
      return NextResponse.json(
        { error: 'Ошибка загрузки популярных товаров из базы данных', details: error.message },
        { status: 500 }
      );
    }

    console.log('Raw data from Supabase:', data); // Логируем сырые данные

    // Проверяем, что данные корректны
    if (!data || data.length === 0) {
      console.log('No popular products found. Conditions: in_stock=true, is_popular=true, not in [balloon, postcard]');
    } else {
      console.log('Popular products fetched:', data);
    }

    // Форматируем данные: берём первое изображение из массива images
    const formattedData = data.map(product => ({
      ...product,
      images: Array.isArray(product.images) && product.images.length > 0 ? [product.images[0]] : [],
    }));

    console.log('Formatted data for response:', formattedData); // Логируем отформатированные данные

    return NextResponse.json(formattedData || [], {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
    });
  } catch (err: any) {
    console.error('Unexpected error in /api/popular:', err);
    return NextResponse.json(
      { error: 'Неожиданная ошибка сервера', details: err.message || 'Нет деталей' },
      { status: 500 }
    );
  }
}

export const revalidate = 3600; // Кэшируем на 1 час