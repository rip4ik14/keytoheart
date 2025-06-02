// ✅ Путь: app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, invalidate } from '@/lib/supabase/server';
import sanitizeHtml from 'sanitize-html';

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

// Серверная санитация
const sanitize = (input: string | undefined): string => {
  return input ? sanitizeHtml(input.trim()) : '';
};

// Генерация уникального slug
const generateUniqueSlug = async (title: string): Promise<string> => {
  try {
    console.log('generateUniqueSlug: Starting with title:', title);
    let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      console.log('generateUniqueSlug: Checking slug:', uniqueSlug);
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('slug', uniqueSlug)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('generateUniqueSlug: Error checking slug uniqueness:', error);
        throw new Error('Ошибка проверки уникальности slug: ' + error.message);
      }

      if (!data) {
        console.log('generateUniqueSlug: Slug is unique:', uniqueSlug);
        break;
      }
      uniqueSlug = `${slug}-${counter++}`;
    }

    return uniqueSlug;
  } catch (err: any) {
    console.error('generateUniqueSlug: Failed:', err);
    throw err;
  }
};

// POST: Создание нового товара
export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/products: Starting request');

    // Проверка CSRF-токена
    const csrfToken = req.headers.get('X-CSRF-Token');
    console.log('POST /api/products: CSRF Token:', csrfToken);
    if (!csrfToken) {
      console.log('POST /api/products: CSRF token missing');
      return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
    }

    // Проверка сессии администратора
    console.log('POST /api/products: Checking admin session');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://keytoheart.ru';
    console.log('POST /api/products: Base URL for admin-session:', baseUrl);
    const sessionRes = await fetch(new URL('/api/admin-session', baseUrl), {
      headers: { cookie: req.headers.get('cookie') || '' },
    });
    console.log('POST /api/products: Admin session response status:', sessionRes.status);

    const sessionData = await sessionRes.json();
    console.log('POST /api/products: Admin session response data:', sessionData);
    if (!sessionRes.ok || !sessionData.success) {
      console.log('POST /api/products: Admin session check failed:', sessionData);
      return NextResponse.json(
        { error: 'Доступ запрещён: требуется роль администратора' },
        { status: 403 }
      );
    }

    // Парсинг тела запроса
    const body: ProductData = await req.json();
    console.log('POST /api/products: Received payload:', body);

    // Валидация входных данных
    if (!body.title || body.title.trim().length < 3) {
      console.log('POST /api/products: Invalid title:', body.title);
      return NextResponse.json({ error: 'Название должно быть ≥ 3 символов' }, { status: 400 });
    }
    if (!body.price || body.price <= 0) {
      console.log('POST /api/products: Invalid price:', body.price);
      return NextResponse.json({ error: 'Цена должна быть > 0' }, { status: 400 });
    }
    if (body.original_price !== undefined && body.original_price <= 0) {
      console.log('POST /api/products: Invalid original_price:', body.original_price);
      return NextResponse.json(
        { error: 'Старая цена должна быть > 0, если указана' },
        { status: 400 }
      );
    }
    if (!body.category_ids || !Array.isArray(body.category_ids) || body.category_ids.length === 0) {
      console.log('POST /api/products: Invalid category_ids:', body.category_ids);
      return NextResponse.json({ error: 'Необходимо указать хотя бы одну категорию' }, { status: 400 });
    }
    if (
      body.discount_percent &&
      (body.discount_percent < 0 || body.discount_percent > 100 || !Number.isInteger(body.discount_percent))
    ) {
      console.log('POST /api/products: Invalid discount_percent:', body.discount_percent);
      return NextResponse.json({ error: 'Скидка должна быть целым числом от 0 до 100%' }, { status: 400 });
    }

    // Валидация категорий
    console.log('POST /api/products: Validating categories');
    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .in('id', body.category_ids);

    if (categoriesError || !categoriesData || categoriesData.length !== body.category_ids.length) {
      console.error('POST /api/products: Categories validation failed:', categoriesError);
      return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
    }
    console.log('POST /api/products: Categories validated:', categoriesData);

    // Валидация подкатегорий
    let finalSubcategoryIds: number[] = [];
    if (body.subcategory_ids && body.subcategory_ids.length > 0) {
      console.log('POST /api/products: Validating subcategories');
      const { data: subcategoriesData, error: subcategoriesError } = await supabaseAdmin
        .from('subcategories')
        .select('id, category_id')
        .in('id', body.subcategory_ids);

      if (subcategoriesError || !subcategoriesData) {
        console.error('POST /api/products: Subcategories validation failed:', subcategoriesError);
        return NextResponse.json({ error: 'Ошибка проверки подкатегорий' }, { status: 400 });
      }
      console.log('POST /api/products: Subcategories fetched:', subcategoriesData);

      for (const subcategory of subcategoriesData) {
        if (subcategory.category_id === null) {
          console.log('POST /api/products: Subcategory missing category_id:', subcategory.id);
          return NextResponse.json(
            { error: `Подкатегория ${subcategory.id} не имеет связанной категории` },
            { status: 400 }
          );
        }
        if (!body.category_ids.includes(subcategory.category_id)) {
          console.log('POST /api/products: Subcategory does not match category:', subcategory.id);
          return NextResponse.json(
            { error: `Подкатегория ${subcategory.id} не соответствует ни одной из выбранных категорий` },
            { status: 400 }
          );
        }
      }

      finalSubcategoryIds = subcategoriesData.map(sub => sub.id);
      console.log('POST /api/products: Final subcategory IDs:', finalSubcategoryIds);
    }

    // Санитация входных данных
    const sanitizedTitle = sanitize(body.title);
    const sanitizedShortDesc = sanitize(body.short_desc);
    const sanitizedDescription = sanitize(body.description);
    const sanitizedComposition = sanitize(body.composition);
    console.log('POST /api/products: Sanitized inputs:', {
      title: sanitizedTitle,
      shortDesc: sanitizedShortDesc,
      description: sanitizedDescription,
      composition: sanitizedComposition,
    });

    // Генерация slug
    console.log('POST /api/products: Generating unique slug');
    const uniqueSlug = await generateUniqueSlug(sanitizedTitle);
    console.log('POST /api/products: Generated slug:', uniqueSlug);

    // Вставка товара в базу данных
    console.log('POST /api/products: Inserting product into Supabase');
    const productPayload = {
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
      order_index: body.order_index ?? 0,
    };
    console.log('POST /api/products: Product payload:', productPayload);

    const { data: productData, error: productError } = await supabaseAdmin
      .from('products')
      .insert(productPayload)
      .select('id')
      .single();

    if (productError) {
      console.error('POST /api/products: Supabase insert error:', productError);
      return NextResponse.json({ error: 'Ошибка вставки товара: ' + productError.message }, { status: 500 });
    }
    console.log('POST /api/products: Product inserted:', productData);

    const productId = productData.id;

    // Привязка категорий
    console.log('POST /api/products: Linking categories');
    const categoryEntries = body.category_ids.map(categoryId => ({
      product_id: productId,
      category_id: categoryId,
    }));
    const { error: categoryLinkError } = await supabaseAdmin
      .from('product_categories')
      .insert(categoryEntries);

    if (categoryLinkError) {
      console.error('POST /api/products: Error linking categories:', categoryLinkError);
      return NextResponse.json({ error: 'Ошибка привязки категорий: ' + categoryLinkError.message }, { status: 500 });
    }
    console.log('POST /api/products: Categories linked:', categoryEntries);

    // Привязка подкатегорий
    if (finalSubcategoryIds.length > 0) {
      console.log('POST /api/products: Linking subcategories');
      const subcategoryEntries = finalSubcategoryIds.map(subcategoryId => ({
        product_id: productId,
        subcategory_id: subcategoryId,
      }));
      const { error: subcategoryLinkError } = await supabaseAdmin
        .from('product_subcategories')
        .insert(subcategoryEntries);

      if (subcategoryLinkError) {
        console.error('POST /api/products: Error linking subcategories:', subcategoryLinkError);
        return NextResponse.json({ error: 'Ошибка привязки подкатегорий: ' + subcategoryLinkError.message }, { status: 500 });
      }
      console.log('POST /api/products: Subcategories linked:', subcategoryEntries);
    }

    // Формирование ответа
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
    console.log('POST /api/products: Product created successfully:', response);

    // Инвалидация кэша
    console.log('POST /api/products: Invalidating cache');
    await invalidate('products');
    await invalidate('/api/popular');
    console.log('POST /api/products: Cache invalidated');

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/products: Failed:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

// GET: Получение списка товаров
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/products: Starting request');
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log('GET /api/products: Fetching products with page:', page, 'limit:', limit);
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select(
        'id, title, price, original_price, discount_percent, in_stock, is_visible, is_popular, images, slug, created_at, production_time, bonus, order_index'
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productsError) {
      console.error('GET /api/products: Error fetching products:', productsError);
      return NextResponse.json({ error: 'Ошибка получения товаров: ' + productsError.message }, { status: 500 });
    }
    console.log('GET /api/products: Products fetched:', products);

    const { count, error: countError } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('GET /api/products: Error fetching count:', countError);
      return NextResponse.json({ error: 'Ошибка подсчёта товаров: ' + countError.message }, { status: 500 });
    }
    console.log('GET /api/products: Total products count:', count);

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('GET /api/products: Failed:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE: Удаление товара
export async function DELETE(req: NextRequest) {
  try {
    console.log('DELETE /api/products: Starting request');
    const sessionRes = await fetch(new URL('/api/admin-session', req.url), {
      headers: { cookie: req.headers.get('cookie') || '' },
    });
    const sessionData = await sessionRes.json();
    if (!sessionRes.ok || !sessionData.success) {
      console.log('DELETE /api/products: Admin session check failed:', sessionData);
      return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log('DELETE /api/products: Product ID to delete:', id);

    if (!id || isNaN(parseInt(id))) {
      console.log('DELETE /api/products: Invalid ID:', id);
      return NextResponse.json({ error: 'ID обязателен и должен быть числом' }, { status: 400 });
    }

    const productId = parseInt(id);

    console.log('DELETE /api/products: Deleting product categories');
    const { error: deleteCategoryError } = await supabaseAdmin
      .from('product_categories')
      .delete()
      .eq('product_id', productId);

    if (deleteCategoryError) {
      console.error('DELETE /api/products: Error deleting product categories:', deleteCategoryError);
      return NextResponse.json(
        { error: 'Ошибка удаления связей с категориями: ' + deleteCategoryError.message },
        { status: 500 }
      );
    }

    console.log('DELETE /api/products: Deleting product subcategories');
    const { error: deleteSubcategoryError } = await supabaseAdmin
      .from('product_subcategories')
      .delete()
      .eq('product_id', productId);

    if (deleteSubcategoryError) {
      console.error('DELETE /api/products: Error deleting product subcategories:', deleteSubcategoryError);
      return NextResponse.json(
        { error: 'Ошибка удаления связей с подкатегориями: ' + deleteSubcategoryError.message },
        { status: 500 }
      );
    }

    console.log('DELETE /api/products: Fetching product images');
    const { data: productData, error: productError } = await supabaseAdmin
      .from('products')
      .select('images')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('DELETE /api/products: Error fetching product:', productError);
      return NextResponse.json({ error: 'Ошибка получения товара: ' + productError.message }, { status: 500 });
    }

    if (productData?.images && productData.images.length > 0) {
      console.log('DELETE /api/products: Deleting product images:', productData.images);
      const fileNames = productData.images.map((url: string) => decodeURIComponent(url.split('/').pop()!));
      const { error: storageError } = await supabaseAdmin.storage
        .from('product-image')
        .remove(fileNames);

      if (storageError) {
        console.error('DELETE /api/products: Error deleting images:', storageError);
        return NextResponse.json({ error: 'Ошибка удаления изображений: ' + storageError.message }, { status: 500 });
      }
      console.log('DELETE /api/products: Images deleted');
    }

    console.log('DELETE /api/products: Deleting product');
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('DELETE /api/products: Error deleting product:', deleteError);
      return NextResponse.json({ error: 'Ошибка удаления товара: ' + deleteError.message }, { status: 500 });
    }
    console.log('DELETE /api/products: Product deleted successfully');

    console.log('DELETE /api/products: Invalidating cache');
    await invalidate('products');
    await invalidate('/api/popular');
    console.log('DELETE /api/products: Cache invalidated');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/products: Failed:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}