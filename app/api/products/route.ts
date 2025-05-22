// ✅ Путь: app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, invalidate } from '@/lib/supabase/server';

interface ProductData {
  id?: number;
  title: string;
  price: number;
  original_price?: number;
  category_names?: string; // Название категории (для отображения)
  category_ids: number[]; // Список ID категорий
  subcategory_ids: number[]; // Список ID подкатегорий
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
  order_index?: number;
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

// Серверная санитизация (замена DOMPurify)
const sanitize = (input: string | undefined): string => {
  if (!input) return '';
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Удаляем script теги
    .replace(/<[^>]*>/g, '') // Удаляем HTML теги
    .replace(/javascript:/gi, '') // Удаляем javascript: протокол
    .replace(/on\w+\s*=/gi, '') // Удаляем event handlers
    .substring(0, 5000); // Ограничиваем длину
};

// Генерация уникального slug
const generateUniqueSlug = async (title: string, excludeId?: number): Promise<string> => {
  let slug = title
    .toLowerCase()
    .replace(/[а-я]/g, (char) => {
      const translit: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 
        'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k',
        'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
        'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return translit[char] || char;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    let query = supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', uniqueSlug);
    
    // Исключаем текущий товар при обновлении
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 — "запись не найдена"
      throw new Error('Ошибка проверки уникальности slug: ' + error.message);
    }

    if (!data) break; // slug уникален
    uniqueSlug = `${slug}-${counter++}`;
  }

  return uniqueSlug;
};

// Проверка admin сессии
async function checkAdminSession(req: NextRequest) {
  try {
    const sessionRes = await fetch(new URL('/api/admin-session', req.url), {
      headers: { cookie: req.headers.get('cookie') || '' },
    });
    const sessionData = await sessionRes.json();
    return sessionRes.ok && sessionData.success;
  } catch (error) {
    console.error('Admin session check failed:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Проверка админ сессии
    const isAdmin = await checkAdminSession(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
    }

    const body: ProductData = await req.json();
    console.log('Received payload for POST:', body);

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
    if (body.discount_percent && (body.discount_percent < 0 || body.discount_percent > 100)) {
      return NextResponse.json({ error: 'Скидка должна быть от 0 до 100%' }, { status: 400 });
    }

    // Проверяем, что все category_ids существуют
    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .in('id', body.category_ids);

    if (categoriesError || !categoriesData || categoriesData.length !== body.category_ids.length) {
      console.error('Categories validation failed:', categoriesError);
      return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
    }

    // Проверяем, что все subcategory_ids существуют и соответствуют выбранным категориям
    let finalSubcategoryIds: number[] = [];
    if (body.subcategory_ids && body.subcategory_ids.length > 0) {
      const { data: subcategoriesData, error: subcategoriesError } = await supabaseAdmin
        .from('subcategories')
        .select('id, category_id')
        .in('id', body.subcategory_ids);

      if (subcategoriesError || !subcategoriesData) {
        console.error('Subcategories validation failed:', subcategoriesError);
        return NextResponse.json({ error: 'Ошибка проверки подкатегорий' }, { status: 400 });
      }

      // Проверяем, что каждая подкатегория принадлежит одной из выбранных категорий
      for (const subcategory of subcategoriesData) {
        if (!subcategory.category_id || !body.category_ids.includes(subcategory.category_id)) {
          return NextResponse.json(
            { error: `Подкатегория ${subcategory.id} не соответствует выбранным категориям` },
            { status: 400 }
          );
        }
      }

      finalSubcategoryIds = subcategoriesData.map(sub => sub.id);
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
        original_price: body.original_price || body.price,
        short_desc: sanitizedShortDesc || null,
        description: sanitizedDescription || null,
        composition: sanitizedComposition || null,
        images: body.images || [],
        discount_percent: body.discount_percent || 0,
        in_stock: body.in_stock ?? true,
        is_visible: body.is_visible ?? true,
        is_popular: body.is_popular ?? false,
        slug: uniqueSlug,
        production_time: body.production_time || null,
        bonus: body.bonus || 0,
        order_index: body.order_index || 0,
      })
      .select('id')
      .single();

    if (productError) {
      console.error('Product creation error:', productError);
      return NextResponse.json({ error: 'Ошибка создания товара: ' + productError.message }, { status: 500 });
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
      console.error('Error linking categories:', categoryLinkError);
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
        console.error('Error linking subcategories:', subcategoryLinkError);
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

    console.log('Product created successfully:', response);
    
    // Инвалидируем кеш
    await invalidate('products');
    await invalidate('/api/popular');
    
    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/products:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера: ' + error.message 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Проверка админ сессии
    const isAdmin = await checkAdminSession(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
    }

    const body: ProductData = await req.json();
    console.log('Received payload for PATCH:', body);

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

    // Проверяем существование товара
    const { data: existingProduct, error: checkError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', body.id)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    // Проверяем категории
    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .in('id', body.category_ids);

    if (categoriesError || !categoriesData || categoriesData.length !== body.category_ids.length) {
      console.error('Categories validation failed:', categoriesError);
      return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
    }

    // Проверяем подкатегории
    let finalSubcategoryIds: number[] = [];
    if (body.subcategory_ids && body.subcategory_ids.length > 0) {
      const { data: subcategoriesData, error: subcategoriesError } = await supabaseAdmin
        .from('subcategories')
        .select('id, category_id')
        .in('id', body.subcategory_ids);

      if (subcategoriesError || !subcategoriesData) {
        console.error('Subcategories validation failed:', subcategoriesError);
        return NextResponse.json({ error: 'Ошибка проверки подкатегорий' }, { status: 400 });
      }

      for (const subcategory of subcategoriesData) {
        if (!subcategory.category_id || !body.category_ids.includes(subcategory.category_id)) {
          return NextResponse.json(
            { error: `Подкатегория ${subcategory.id} не соответствует выбранным категориям` },
            { status: 400 }
          );
        }
      }

      finalSubcategoryIds = subcategoriesData.map(sub => sub.id);
    }

    // Санитизация текстовых полей
    const sanitizedTitle = sanitize(body.title);
    const sanitizedShortDesc = sanitize(body.short_desc);
    const sanitizedDescription = sanitize(body.description);
    const sanitizedComposition = sanitize(body.composition);

    // Генерация уникального slug (исключая текущий товар)
    const uniqueSlug = await generateUniqueSlug(sanitizedTitle, body.id);

    // Обновление товара
    const { data: productData, error: productError } = await supabaseAdmin
      .from('products')
      .update({
        title: sanitizedTitle,
        price: body.price,
        original_price: body.original_price || body.price,
        short_desc: sanitizedShortDesc || null,
        description: sanitizedDescription || null,
        composition: sanitizedComposition || null,
        images: body.images || [],
        discount_percent: body.discount_percent || 0,
        in_stock: body.in_stock ?? true,
        is_visible: body.is_visible ?? true,
        is_popular: body.is_popular ?? false,
        slug: uniqueSlug,
        production_time: body.production_time || null,
        bonus: body.bonus || 0,
      })
      .eq('id', body.id)
      .select('id')
      .single();

    if (productError) {
      console.error('Product update error:', productError);
      return NextResponse.json({ error: 'Ошибка обновления товара: ' + productError.message }, { status: 500 });
    }

    const productId = productData.id;

    // Удаляем старые связи
    await supabaseAdmin.from('product_categories').delete().eq('product_id', productId);
    await supabaseAdmin.from('product_subcategories').delete().eq('product_id', productId);

    // Создаём новые связи с категориями
    const categoryEntries = body.category_ids.map(categoryId => ({
      product_id: productId,
      category_id: categoryId,
    }));
    
    const { error: categoryLinkError } = await supabaseAdmin
      .from('product_categories')
      .insert(categoryEntries);

    if (categoryLinkError) {
      console.error('Error linking categories:', categoryLinkError);
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
        console.error('Error linking subcategories:', subcategoryLinkError);
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

    console.log('Product updated successfully:', response);
    
    // Инвалидируем кеш
    await invalidate('products');
    await invalidate('/api/popular');
    
    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Unexpected error in PATCH /api/products:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Проверка админ сессии
    const isAdmin = await checkAdminSession(req);
    if (!isAdmin) {
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
      console.error('Error fetching product for deletion:', fetchError);
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    // Удаляем связанные изображения из хранилища
    if (productData?.images && Array.isArray(productData.images) && productData.images.length > 0) {
      try {
        const fileNames = productData.images.map((url: string) => {
          const parts = url.split('/');
          return decodeURIComponent(parts[parts.length - 1]);
        });
        
        const { error: storageError } = await supabaseAdmin.storage
          .from('product-image')
          .remove(fileNames);

        if (storageError) {
          console.error('Error deleting images from storage:', storageError);
          // Не прерываем удаление товара из-за ошибки удаления изображений
        }
      } catch (imageError) {
        console.error('Error processing images for deletion:', imageError);
      }
    }

    // Удаляем товар (связи удалятся автоматически через CASCADE)
    const { data, error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error) {
      console.error('Product deletion error:', error);
      return NextResponse.json({ error: 'Ошибка удаления товара: ' + error.message }, { status: 500 });
    }

    console.log('Product deleted successfully:', data);
    
    // Инвалидируем кеш
    await invalidate('products');
    await invalidate('/api/popular');
    
    return NextResponse.json({ success: true, id: data.id });

  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/products:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера: ' + error.message 
    }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const visible = searchParams.get('visible');
    const popular = searchParams.get('popular');
    const inStock = searchParams.get('in_stock');
    const limit = searchParams.get('limit');

    // Получаем связи товаров с категориями
    const { data: productCategoryData, error: productCategoryError } = await supabaseAdmin
      .from('product_categories')
      .select('product_id, category_id');

    if (productCategoryError) {
      console.error('Error fetching product categories:', productCategoryError);
      return NextResponse.json({ error: 'Ошибка загрузки связей категорий' }, { status: 500 });
    }

    // Группируем category_ids по product_id
    const productCategoriesMap = new Map<number, number[]>();
    productCategoryData.forEach(item => {
      const existing = productCategoriesMap.get(item.product_id) || [];
      productCategoriesMap.set(item.product_id, [...existing, item.category_id]);
    });

    const productIds = Array.from(productCategoriesMap.keys());

    // Строим запрос товаров
    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        title,
        price,
        original_price,
        discount_percent,
        images,
        image_url,
        created_at,
        slug,
        bonus,
        short_desc,
        description,
        composition,
        is_popular,
        is_visible,
        in_stock,
        production_time,
        order_index
      `)
      .in('id', productIds.length > 0 ? productIds : [0]) // Показываем только товары с категориями
      .order('order_index', { ascending: true })
      .order('id', { ascending: false });

    // Применяем фильтры
    if (visible === 'true') {
      query = query.eq('is_visible', true);
    } else if (visible === 'false') {
      query = query.eq('is_visible', false);
    }

    if (popular === 'true') {
      query = query.eq('is_popular', true);
    } else if (popular === 'false') {
      query = query.eq('is_popular', false);
    }

    if (inStock === 'true') {
      query = query.eq('in_stock', true);
    } else if (inStock === 'false') {
      query = query.eq('in_stock', false);
    }

    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Ошибка загрузки товаров: ' + error.message }, { status: 500 });
    }

    // Фильтруем по категории, если указана
    let filteredProducts = data || [];
    if (category) {
      // Находим ID категории по slug или названию
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .or(`slug.eq.${category},name.ilike.%${category}%`)
        .single();

      if (!categoryError && categoryData) {
        filteredProducts = filteredProducts.filter(product =>
          productCategoriesMap.get(product.id)?.includes(categoryData.id)
        );
      }
    }

    // Добавляем category_ids к каждому товару
    const productsWithCategories = filteredProducts.map(product => ({
      ...product,
      category_ids: productCategoriesMap.get(product.id) || [],
      images: Array.isArray(product.images) ? product.images : [], // Нормализуем images
    }));

    console.log(`GET /api/products: возвращено ${productsWithCategories.length} товаров`);

    return NextResponse.json({
      products: productsWithCategories,
      total: productsWithCategories.length
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/products:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера: ' + error.message 
    }, { status: 500 });
  }
}