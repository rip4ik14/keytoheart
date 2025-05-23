import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, invalidate } from '@/lib/supabase/server';
import sanitizeHtml from 'sanitize-html';
import type { Tables } from '@/lib/supabase/types_new';

interface ProductData {
  id?: number;
  title: string;
  price: number;
  original_price?: number;
  category: string;
  category_ids: number[];
  subcategory_ids: number[];
  short_desc?: string;
  description?: string;
  composition?: string;
  images?: string[];
  discount_percent?: number;
  in_stock?: boolean;
  is_visible?: boolean;
  is_popular?: boolean;
  production_time?: number | null;
  bonus?: number;
}

interface ProductResponse {
  id: number;
  title: string;
  price: number;
  original_price?: number;
  category_ids: number[];
  subcategory_ids: number[];
  discount_percent?: number;
  is_visible?: boolean;
}

interface SubcategorySelect {
  id: number;
  category_id: number | null;
}

// Санитизация текстовых полей для Node.js (безопасно и стабильно)
const sanitize = (input: string | undefined): string => {
  return input
    ? sanitizeHtml(input.trim(), {
        allowedTags: [],      // удаляем ВСЕ html-теги (только текст)
        allowedAttributes: {}, // удаляем ВСЕ атрибуты
      })
    : '';
};

// Генерация уникального slug
const generateUniqueSlug = async (title: string): Promise<string> => {
  let slug = title.toLowerCase().replace(/[^a-z0-9а-я]+/g, '-').replace(/(^-|-$)/g, '');
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', uniqueSlug)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error('Ошибка проверки уникальности slug: ' + error.message);
    }
    if (!data) break;
    uniqueSlug = `${slug}-${counter++}`;
  }

  return uniqueSlug;
};

export async function POST(req: NextRequest) {
  const sessionRes = await fetch(new URL('/api/admin-session', req.url), {
    headers: { cookie: req.headers.get('cookie') || '' },
  });
  const sessionData = await sessionRes.json();
  if (!sessionRes.ok || !sessionData.success) {
    return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
  }

  const body: ProductData = await req.json();
  // Валидация входных данных
  if (!body.title || body.title.trim().length < 3) {
    return NextResponse.json({ error: 'Название должно быть ≥ 3 символов' }, { status: 400 });
  }
  if (!body.price || body.price <= 0) {
    return NextResponse.json({ error: 'Цена должна быть > 0' }, { status: 400 });
  }
  if (body.original_price && body.original_price <= 0) {
    return NextResponse.json({ error: 'Старая цена должна быть > 0' }, { status: 400 });
  }
  if (!body.category_ids || !Array.isArray(body.category_ids) || body.category_ids.length === 0) {
    return NextResponse.json({ error: 'Необходимо указать хотя бы одну категорию' }, { status: 400 });
  }
  if (
    body.discount_percent &&
    (body.discount_percent < 0 || body.discount_percent > 100 || !Number.isInteger(body.discount_percent))
  ) {
    return NextResponse.json({ error: 'Скидка должна быть целым числом от 0 до 100%' }, { status: 400 });
  }

  // Проверяем, что все category_ids существуют
  const { data: categoriesData, error: categoriesError } = await supabaseAdmin
    .from('categories')
    .select('id')
    .in('id', body.category_ids);

  if (categoriesError || !categoriesData || categoriesData.length !== body.category_ids.length) {
    return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
  }

  // Проверяем, что все subcategory_ids существуют и соответствуют хотя бы одной из категорий
  let finalSubcategoryIds: number[] = [];
  if (body.subcategory_ids && body.subcategory_ids.length > 0) {
    const { data: subcategoriesData, error: subcategoriesError } = await supabaseAdmin
      .from('subcategories')
      .select('id, category_id')
      .in('id', body.subcategory_ids);

    if (subcategoriesError || !subcategoriesData) {
      return NextResponse.json({ error: 'Ошибка проверки подкатегорий' }, { status: 400 });
    }

    for (const subcategory of subcategoriesData) {
      if (subcategory.category_id === null) {
        return NextResponse.json(
          { error: `Подкатегория ${subcategory.id} не имеет связанной категории` },
          { status: 400 }
        );
      }
      if (!body.category_ids.includes(subcategory.category_id)) {
        return NextResponse.json(
          { error: `Подкатегория ${subcategory.id} не соответствует ни одной из выбранных категорий` },
          { status: 400 }
        );
      }
    }

    finalSubcategoryIds = subcategoriesData.map((sub: SubcategorySelect) => sub.id);
  }

  // Санитизация текстовых полей
  const sanitizedTitle = sanitize(body.title);
  const sanitizedShortDesc = sanitize(body.short_desc);
  const sanitizedDescription = sanitize(body.description);
  const sanitizedComposition = sanitize(body.composition);

  // Генерация уникального slug
  const uniqueSlug = await generateUniqueSlug(sanitizedTitle);

  // Создание товара
  const { data: productData, error: productError } = await supabaseAdmin
    .from('products')
    .insert({
      title: sanitizedTitle,
      price: body.price,
      original_price: body.original_price ?? body.price,
      short_desc: sanitizedShortDesc,
      description: sanitizedDescription,
      composition: sanitizedComposition,
      images: body.images ?? [],
      discount_percent: body.discount_percent ?? 0,
      in_stock: body.in_stock ?? true,
      is_visible: body.is_visible ?? true,
      is_popular: body.is_popular ?? false,
      created_at: new Date().toISOString(),
      slug: uniqueSlug,
      production_time: body.production_time ?? null,
      bonus: body.bonus ?? 0,
    })
    .select('id')
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const productId = productData.id;

  // Связываем товар с категориями
  const categoryEntries = body.category_ids.map(categoryId => ({
    product_id: productId,
    category_id: categoryId,
  }));
  const { error: categoryLinkError } = await supabaseAdmin
    .from('product_categories')
    .insert(categoryEntries);

  if (categoryLinkError) {
    return NextResponse.json({ error: 'Ошибка привязки категорий: ' + categoryLinkError.message }, { status: 500 });
  }

  // Связываем товар с подкатегориями
  if (finalSubcategoryIds.length > 0) {
    const subcategoryEntries = finalSubcategoryIds.map(subcategoryId => ({
      product_id: productId,
      subcategory_id: subcategoryId,
    }));
    const { error: subcategoryLinkError } = await supabaseAdmin
      .from('product_subcategories')
      .insert(subcategoryEntries);

    if (subcategoryLinkError) {
      return NextResponse.json({ error: 'Ошибка привязки подкатегорий: ' + subcategoryLinkError.message }, { status: 500 });
    }
  }

  const response: ProductResponse = {
    id: productId,
    title: sanitizedTitle,
    price: body.price,
    original_price: body.original_price,
    category_ids: body.category_ids,
    subcategory_ids: finalSubcategoryIds,
    discount_percent: body.discount_percent,
    is_visible: body.is_visible,
  };

  await invalidate('products');
  await invalidate('/api/popular');
  return NextResponse.json(response, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sessionRes = await fetch(new URL('/api/admin-session', req.url), {
    headers: { cookie: req.headers.get('cookie') || '' },
  });
  const sessionData = await sessionRes.json();
  if (!sessionRes.ok || !sessionData.success) {
    return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
  }

  const body: ProductData = await req.json();

  // Валидация входных данных
  if (!body.id) {
    return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
  }
  if (!body.title || body.title.trim().length < 3) {
    return NextResponse.json({ error: 'Название должно быть ≥ 3 символов' }, { status: 400 });
  }
  if (!body.price || body.price <= 0) {
    return NextResponse.json({ error: 'Цена должна быть > 0' }, { status: 400 });
  }
  if (body.original_price && body.original_price <= 0) {
    return NextResponse.json({ error: 'Старая цена должна быть > 0' }, { status: 400 });
  }
  if (!body.category_ids || !Array.isArray(body.category_ids) || body.category_ids.length === 0) {
    return NextResponse.json({ error: 'Необходимо указать хотя бы одну категорию' }, { status: 400 });
  }
  if (
    body.discount_percent &&
    (body.discount_percent < 0 || body.discount_percent > 100 || !Number.isInteger(body.discount_percent))
  ) {
    return NextResponse.json({ error: 'Скидка должна быть целым числом от 0 до 100%' }, { status: 400 });
  }

  // Проверяем, что все category_ids существуют
  const { data: categoriesData, error: categoriesError } = await supabaseAdmin
    .from('categories')
    .select('id')
    .in('id', body.category_ids);

  if (categoriesError || !categoriesData || categoriesData.length !== body.category_ids.length) {
    return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
  }

  // Проверяем, что все subcategory_ids существуют и соответствуют хотя бы одной из категорий
  let finalSubcategoryIds: number[] = [];
  if (body.subcategory_ids && body.subcategory_ids.length > 0) {
    const { data: subcategoriesData, error: subcategoriesError } = await supabaseAdmin
      .from('subcategories')
      .select('id, category_id')
      .in('id', body.subcategory_ids);

    if (subcategoriesError || !subcategoriesData) {
      return NextResponse.json({ error: 'Ошибка проверки подкатегорий' }, { status: 400 });
    }

    for (const subcategory of subcategoriesData) {
      if (subcategory.category_id === null) {
        return NextResponse.json(
          { error: `Подкатегория ${subcategory.id} не имеет связанной категории` },
          { status: 400 }
        );
      }
      if (!body.category_ids.includes(subcategory.category_id)) {
        return NextResponse.json(
          { error: `Подкатегория ${subcategory.id} не соответствует ни одной из выбранных категорий` },
          { status: 400 }
        );
      }
    }

    finalSubcategoryIds = subcategoriesData.map((sub: SubcategorySelect) => sub.id);
  }

  // Санитизация текстовых полей
  const sanitizedTitle = sanitize(body.title);
  const sanitizedShortDesc = sanitize(body.short_desc);
  const sanitizedDescription = sanitize(body.description);
  const sanitizedComposition = sanitize(body.composition);

  // Генерация уникального slug
  const uniqueSlug = await generateUniqueSlug(sanitizedTitle);

  // Обновление товара
  const { data: productData, error: productError } = await supabaseAdmin
    .from('products')
    .update({
      title: sanitizedTitle,
      price: body.price,
      original_price: body.original_price ?? body.price,
      short_desc: sanitizedShortDesc,
      description: sanitizedDescription,
      composition: sanitizedComposition,
      images: body.images ?? [],
      discount_percent: body.discount_percent ?? 0,
      in_stock: body.in_stock ?? true,
      is_visible: body.is_visible ?? true,
      is_popular: body.is_popular ?? false,
      slug: uniqueSlug,
      production_time: body.production_time ?? null,
      bonus: body.bonus ?? 0,
    })
    .eq('id', body.id)
    .select('id')
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const productId = productData.id;

  // Удаляем старые связи с категориями и подкатегориями
  const { error: deleteCategoryError } = await supabaseAdmin
    .from('product_categories')
    .delete()
    .eq('product_id', productId);

  if (deleteCategoryError) {
    return NextResponse.json({ error: 'Ошибка удаления старых связей с категориями: ' + deleteCategoryError.message }, { status: 500 });
  }

  const { error: deleteSubcategoryError } = await supabaseAdmin
    .from('product_subcategories')
    .delete()
    .eq('product_id', productId);

  if (deleteSubcategoryError) {
    return NextResponse.json({ error: 'Ошибка удаления старых связей с подкатегориями: ' + deleteSubcategoryError.message }, { status: 500 });
  }

  // Создаём новые связи с категориями
  const categoryEntries = body.category_ids.map(categoryId => ({
    product_id: productId,
    category_id: categoryId,
  }));
  const { error: categoryLinkError } = await supabaseAdmin
    .from('product_categories')
    .insert(categoryEntries);

  if (categoryLinkError) {
    return NextResponse.json({ error: 'Ошибка привязки категорий: ' + categoryLinkError.message }, { status: 500 });
  }

  // Создаём новые связи с подкатегориями
  if (finalSubcategoryIds.length > 0) {
    const subcategoryEntries = finalSubcategoryIds.map(subcategoryId => ({
      product_id: productId,
      subcategory_id: subcategoryId,
    }));
    const { error: subcategoryLinkError } = await supabaseAdmin
      .from('product_subcategories')
      .insert(subcategoryEntries);

    if (subcategoryLinkError) {
      return NextResponse.json({ error: 'Ошибка привязки подкатегорий: ' + subcategoryLinkError.message }, { status: 500 });
    }
  }

  const response: ProductResponse = {
    id: productId,
    title: sanitizedTitle,
    price: body.price,
    original_price: body.original_price,
    category_ids: body.category_ids,
    subcategory_ids: finalSubcategoryIds,
    discount_percent: body.discount_percent,
    is_visible: body.is_visible,
  };

  await invalidate('products');
  await invalidate('/api/popular');
  return NextResponse.json(response, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const sessionRes = await fetch(new URL('/api/admin-session', req.url), {
    headers: { cookie: req.headers.get('cookie') || '' },
  });
  const sessionData = await sessionRes.json();
  if (!sessionRes.ok || !sessionData.success) {
    return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
  }

  // Получаем данные о товаре для удаления связанных изображений
  const { data: productData, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('images')
    .eq('id', id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Удаляем связанные изображения из хранилища
  if (productData?.images && productData.images.length > 0) {
    const fileNames = productData.images.map((url: string) => decodeURIComponent(url.split('/').pop()!));
    const { error: storageError } = await supabaseAdmin.storage
      .from('products')
      .remove(fileNames);

    if (storageError) {
      return NextResponse.json({ error: 'Ошибка удаления изображений: ' + storageError.message }, { status: 500 });
    }
  }

  // Удаляем товар
  const { data, error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidate('products');
  await invalidate('/api/popular');
  return NextResponse.json({ success: true, id: data.id });
}
