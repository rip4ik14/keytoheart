// Описание: API для управления товарами (создание, обновление, удаление).
// Поддерживает добавление товаров в подкатегории через subcategory_id.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, invalidate } from '@/lib/supabase/server';

interface ProductData {
  id?: number;
  title: string;
  price: number;
  original_price?: number;
  category_id: number;
  subcategory_id?: number; // Подкатегория опциональна
  short_desc?: string;
  description?: string;
  composition?: string;
  images?: string[];
  discount_percent?: number;
  in_stock?: boolean;
  is_visible?: boolean;
  is_popular?: boolean;
}

interface ProductResponse {
  id: number;
  title: string;
  price: number;
  original_price?: number;
  category_id: number;
  subcategory_id?: number;
  discount_percent?: number;
  is_visible?: boolean;
}

export async function POST(req: NextRequest) {
  const sessionRes = await fetch(new URL('/api/admin-session', req.url), {
    headers: { cookie: req.headers.get('cookie') || '' },
  });
  const sessionData = await sessionRes.json();
  if (!sessionRes.ok || !sessionData.success) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const body: ProductData = await req.json();
  console.log('Received payload:', body);

  // Валидация входных данных
  if (!body.title || body.title.trim().length < 3) {
    return NextResponse.json({ error: 'Название ≥ 3 символов' }, { status: 400 });
  }
  if (!body.price || body.price <= 0) {
    return NextResponse.json({ error: 'Цена должна быть > 0' }, { status: 400 });
  }
  if (body.original_price && body.original_price <= 0) {
    return NextResponse.json({ error: 'Старая цена должна быть > 0' }, { status: 400 });
  }
  if (!body.category_id) {
    return NextResponse.json({ error: 'Категория обязательна' }, { status: 400 });
  }

  // Получаем название категории
  const { data: categoryData, error: categoryError } = await supabaseAdmin
    .from('categories')
    .select('name')
    .eq('id', body.category_id)
    .single();

  if (categoryError || !categoryData) {
    console.error('Error fetching category:', categoryError);
    return NextResponse.json({ error: 'Категория не найдена' }, { status: 400 });
  }

  const categoryName = categoryData.name;

  // Проверяем, что subcategory_id соответствует category_id
  let finalSubcategoryId = body.subcategory_id ?? null;
  if (body.subcategory_id) {
    const { data: subcategoryData, error: subcategoryError } = await supabaseAdmin
      .from('subcategories')
      .select('id')
      .eq('id', body.subcategory_id)
      .eq('category_id', body.category_id)
      .single();

    if (subcategoryError || !subcategoryData) {
      console.error('Subcategory validation failed:', {
        subcategory_id: body.subcategory_id,
        category_id: body.category_id,
        error: subcategoryError?.message,
      });
      return NextResponse.json(
        { error: 'Подкатегория не соответствует выбранной категории или не существует' },
        { status: 400 }
      );
    }
    finalSubcategoryId = subcategoryData.id;
    console.log('Validated subcategory_id:', finalSubcategoryId);
  } else {
    console.log('No subcategory_id provided, setting to null');
  }

  // Создание товара
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      title: body.title.trim(),
      price: body.price,
      original_price: body.original_price ?? body.price,
      category: categoryName,
      category_id: body.category_id,
      subcategory_id: finalSubcategoryId,
      short_desc: body.short_desc ?? '',
      description: body.description ?? '',
      composition: body.composition ?? '',
      images: body.images ?? [],
      discount_percent: body.discount_percent ?? 0,
      in_stock: body.in_stock ?? true,
      is_visible: body.is_visible ?? true,
      is_popular: body.is_popular ?? false,
      created_at: new Date().toISOString(),
      slug: body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    })
    .select('id, title, price, original_price, category_id, subcategory_id, discount_percent, is_visible')
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('Product created:', data);
  await invalidate('products');
  await invalidate('/api/popular');
  return NextResponse.json(data as ProductResponse, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sessionRes = await fetch(new URL('/api/admin-session', req.url), {
    headers: { cookie: req.headers.get('cookie') || '' },
  });
  const sessionData = await sessionRes.json();
  if (!sessionRes.ok || !sessionData.success) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const body: ProductData = await req.json();
  console.log('Received payload for PATCH:', body);

  // Валидация входных данных
  if (!body.id) {
    return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
  }
  if (!body.title || body.title.trim().length < 3) {
    return NextResponse.json({ error: 'Название ≥ 3 символов' }, { status: 400 });
  }
  if (!body.price || body.price <= 0) {
    return NextResponse.json({ error: 'Цена должна быть > 0' }, { status: 400 });
  }
  if (body.original_price && body.original_price <= 0) {
    return NextResponse.json({ error: 'Старая цена должна быть > 0' }, { status: 400 });
  }
  if (!body.category_id) {
    return NextResponse.json({ error: 'Категория обязательна' }, { status: 400 });
  }

  // Получаем название категории
  const { data: categoryData, error: categoryError } = await supabaseAdmin
    .from('categories')
    .select('name')
    .eq('id', body.category_id)
    .single();

  if (categoryError || !categoryData) {
    console.error('Error fetching category:', categoryError);
    return NextResponse.json({ error: 'Категория не найдена' }, { status: 400 });
  }

  const categoryName = categoryData.name;

  // Проверяем, что subcategory_id соответствует category_id
  let finalSubcategoryId = body.subcategory_id ?? null;
  if (body.subcategory_id) {
    const { data: subcategoryData, error: subcategoryError } = await supabaseAdmin
      .from('subcategories')
      .select('id')
      .eq('id', body.subcategory_id)
      .eq('category_id', body.category_id)
      .single();

    if (subcategoryError || !subcategoryData) {
      console.error('Subcategory validation failed:', {
        subcategory_id: body.subcategory_id,
        category_id: body.category_id,
        error: subcategoryError?.message,
      });
      return NextResponse.json(
        { error: 'Подкатегория не соответствует выбранной категории или не существует' },
        { status: 400 }
      );
    }
    finalSubcategoryId = subcategoryData.id;
    console.log('Validated subcategory_id:', finalSubcategoryId);
  } else {
    console.log('No subcategory_id provided, setting to null');
  }

  // Обновление товара
  const { data, error } = await supabaseAdmin
    .from('products')
    .update({
      title: body.title.trim(),
      price: body.price,
      original_price: body.original_price ?? body.price,
      category: categoryName,
      category_id: body.category_id,
      subcategory_id: finalSubcategoryId,
      short_desc: body.short_desc ?? '',
      description: body.description ?? '',
      composition: body.composition ?? '',
      images: body.images ?? [],
      discount_percent: body.discount_percent ?? 0,
      in_stock: body.in_stock ?? true,
      is_visible: body.is_visible ?? true,
      is_popular: body.is_popular ?? false,
    })
    .eq('id', body.id)
    .select('id, title, price, original_price, category_id, subcategory_id, discount_percent, is_visible')
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('Product updated:', data);
  await invalidate('products');
  await invalidate('/api/popular');
  return NextResponse.json(data as ProductResponse, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const sessionRes = await fetch(new URL('/api/admin-session', req.url), {
    headers: { cookie: req.headers.get('cookie') || '' },
  });
  const sessionData = await sessionRes.json();
  if (!sessionRes.ok || !sessionData.success) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('Product deleted:', data);
  await invalidate('products');
  await invalidate('/api/popular');
  return NextResponse.json({ success: true, id: data.id });
}