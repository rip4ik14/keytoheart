// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, invalidate } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
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
    process.env.NODE_ENV !== "production" && console.log('generateUniqueSlug: Starting with title:', title);
    let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      process.env.NODE_ENV !== "production" &&
        console.log('generateUniqueSlug: Checking slug:', uniqueSlug);
      const existing = await prisma.products.findFirst({
        where: { slug: uniqueSlug },
        select: { id: true },
      });

      if (!existing) {
        process.env.NODE_ENV !== "production" &&
          console.log('generateUniqueSlug: Slug is unique:', uniqueSlug);
        break;
      }

      uniqueSlug = `${slug}-${counter++}`;
    }

    return uniqueSlug;
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('generateUniqueSlug: Failed:', err);
    throw err;
  }
};

// POST: Создание нового товара
export async function POST(req: NextRequest) {
  try {
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Starting request');

    // Проверка CSRF-токена
    const csrfToken = req.headers.get('X-CSRF-Token');
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: CSRF Token:', csrfToken);
    if (!csrfToken) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/products: CSRF token missing');
      return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
    }

    // Проверка сессии администратора
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Checking admin session');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://keytoheart.ru';
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Base URL for admin-session:', baseUrl);
    const sessionRes = await fetch(new URL('/api/admin-session', baseUrl), {
      headers: { cookie: req.headers.get('cookie') || '' },
    });
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Admin session response status:', sessionRes.status);

    const sessionData = await sessionRes.json();
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Admin session response data:', sessionData);
    if (!sessionRes.ok || !sessionData.success) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/products: Admin session check failed:', sessionData);
      return NextResponse.json(
        { error: 'Доступ запрещён: требуется роль администратора' },
        { status: 403 }
      );
    }

    // Парсинг тела запроса
    const body: ProductData = await req.json();
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Received payload:', body);

    // Валидация входных данных
    if (!body.title || body.title.trim().length < 3) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/products: Invalid title:', body.title);
      return NextResponse.json({ error: 'Название должно быть ≥ 3 символов' }, { status: 400 });
    }
    if (!body.price || body.price <= 0) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/products: Invalid price:', body.price);
      return NextResponse.json({ error: 'Цена должна быть > 0' }, { status: 400 });
    }
    if (body.original_price !== undefined && body.original_price <= 0) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/products: Invalid original_price:', body.original_price);
      return NextResponse.json(
        { error: 'Старая цена должна быть > 0, если указана' },
        { status: 400 }
      );
    }
    if (!body.category_ids || !Array.isArray(body.category_ids) || body.category_ids.length === 0) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/products: Invalid category_ids:', body.category_ids);
      return NextResponse.json({ error: 'Необходимо указать хотя бы одну категорию' }, { status: 400 });
    }
    if (
      body.discount_percent &&
      (body.discount_percent < 0 || body.discount_percent > 100 || !Number.isInteger(body.discount_percent))
    ) {
      process.env.NODE_ENV !== "production" && console.log('POST /api/products: Invalid discount_percent:', body.discount_percent);
      return NextResponse.json({ error: 'Скидка должна быть целым числом от 0 до 100%' }, { status: 400 });
    }

    // Валидация категорий
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Validating categories');
    let categoriesData;
    try {
      categoriesData = await prisma.categories.findMany({
        where: { id: { in: body.category_ids } },
        select: { id: true },
      });
    } catch (categoriesError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('POST /api/products: Categories validation failed:', categoriesError);
      return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
    }

    if (!categoriesData || categoriesData.length !== body.category_ids.length) {
      process.env.NODE_ENV !== "production" &&
        console.error('POST /api/products: Categories validation failed: count mismatch');
      return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
    }
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Categories validated:', categoriesData);

    // Валидация подкатегорий
    let finalSubcategoryIds: number[] = [];
    if (body.subcategory_ids && body.subcategory_ids.length > 0) {
      process.env.NODE_ENV !== "production" &&
        console.log('POST /api/products: Validating subcategories');
      let subcategoriesData;
      try {
        subcategoriesData = await prisma.subcategories.findMany({
          where: { id: { in: body.subcategory_ids } },
          select: { id: true, category_id: true },
        });
      } catch (subcategoriesError: any) {
        process.env.NODE_ENV !== "production" &&
          console.error('POST /api/products: Subcategories validation failed:', subcategoriesError);
        return NextResponse.json({ error: 'Ошибка проверки подкатегорий' }, { status: 400 });
      }
      process.env.NODE_ENV !== "production" &&
        console.log('POST /api/products: Subcategories fetched:', subcategoriesData);

      for (const subcategory of subcategoriesData) {
        if (subcategory.category_id === null) {
          process.env.NODE_ENV !== "production" && console.log('POST /api/products: Subcategory missing category_id:', subcategory.id);
          return NextResponse.json(
            { error: `Подкатегория ${subcategory.id} не имеет связанной категории` },
            { status: 400 }
          );
        }
        if (!body.category_ids.includes(subcategory.category_id)) {
          process.env.NODE_ENV !== "production" && console.log('POST /api/products: Subcategory does not match category:', subcategory.id);
          return NextResponse.json(
            { error: `Подкатегория ${subcategory.id} не соответствует ни одной из выбранных категорий` },
            { status: 400 }
          );
        }
      }

      finalSubcategoryIds = subcategoriesData.map(sub => sub.id);
      process.env.NODE_ENV !== "production" && console.log('POST /api/products: Final subcategory IDs:', finalSubcategoryIds);
    }

    // Санитация входных данных
    const sanitizedTitle = sanitize(body.title);
    const sanitizedShortDesc = sanitize(body.short_desc);
    const sanitizedDescription = sanitize(body.description);
    const sanitizedComposition = sanitize(body.composition);
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Sanitized inputs:', {
      title: sanitizedTitle,
      shortDesc: sanitizedShortDesc,
      description: sanitizedDescription,
      composition: sanitizedComposition,
    });

    // Генерация slug
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Generating unique slug');
    const uniqueSlug = await generateUniqueSlug(sanitizedTitle);
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Generated slug:', uniqueSlug);

    // Вставка товара в базу данных
    process.env.NODE_ENV !== "production" &&
      console.log('POST /api/products: Inserting product into database');
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
      created_at: new Date(),
      slug: uniqueSlug,
      production_time: body.production_time ?? null,
      bonus: body.bonus ?? 0,
      order_index: body.order_index ?? 0,
    };
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Product payload:', productPayload);

    let productData;
    try {
      productData = await prisma.products.create({
        data: productPayload,
        select: { id: true },
      });
    } catch (productError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('POST /api/products: Prisma insert error:', productError);
      return NextResponse.json(
        { error: 'Ошибка вставки товара: ' + productError.message },
        { status: 500 },
      );
    }
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Product inserted:', productData);

    const productId = productData.id;

    // Привязка категорий
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Linking categories');
    const categoryEntries = body.category_ids.map((categoryId) => ({
      product_id: productId,
      category_id: categoryId,
    }));
    try {
      if (categoryEntries.length > 0) {
        await prisma.product_categories.createMany({ data: categoryEntries });
      }
    } catch (categoryLinkError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('POST /api/products: Error linking categories:', categoryLinkError);
      return NextResponse.json(
        { error: 'Ошибка привязки категорий: ' + categoryLinkError.message },
        { status: 500 },
      );
    }
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Categories linked:', categoryEntries);

    // Привязка подкатегорий
    if (finalSubcategoryIds.length > 0) {
      process.env.NODE_ENV !== "production" &&
        console.log('POST /api/products: Linking subcategories');
      const subcategoryEntries = finalSubcategoryIds.map((subcategoryId) => ({
        product_id: productId,
        subcategory_id: subcategoryId,
      }));
      try {
        await prisma.product_subcategories.createMany({ data: subcategoryEntries });
      } catch (subcategoryLinkError: any) {
        process.env.NODE_ENV !== "production" &&
          console.error('POST /api/products: Error linking subcategories:', subcategoryLinkError);
        return NextResponse.json(
          { error: 'Ошибка привязки подкатегорий: ' + subcategoryLinkError.message },
          { status: 500 },
        );
      }
      process.env.NODE_ENV !== "production" &&
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
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Product created successfully:', response);

    // Инвалидация кэша
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Invalidating cache');
    await invalidate('products');
    await invalidate('/api/popular');
    process.env.NODE_ENV !== "production" && console.log('POST /api/products: Cache invalidated');

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('POST /api/products: Failed:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

// GET: Получение списка товаров
export async function GET(req: NextRequest) {
  try {
    process.env.NODE_ENV !== "production" && console.log('GET /api/products: Starting request');
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    process.env.NODE_ENV !== "production" && console.log('GET /api/products: Fetching products with page:', page, 'limit:', limit);
    let products;
    try {
      products = await prisma.products.findMany({
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          price: true,
          original_price: true,
          discount_percent: true,
          in_stock: true,
          is_visible: true,
          is_popular: true,
          images: true,
          slug: true,
          created_at: true,
          production_time: true,
          bonus: true,
          order_index: true,
        },
      });
    } catch (productsError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('GET /api/products: Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Ошибка получения товаров: ' + productsError.message },
        { status: 500 },
      );
    }
    process.env.NODE_ENV !== "production" &&
      console.log('GET /api/products: Products fetched:', products);

    let count: number;
    try {
      count = await prisma.products.count();
    } catch (countError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('GET /api/products: Error fetching count:', countError);
      return NextResponse.json(
        { error: 'Ошибка подсчёта товаров: ' + countError.message },
        { status: 500 },
      );
    }
    process.env.NODE_ENV !== "production" &&
      console.log('GET /api/products: Total products count:', count);

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('GET /api/products: Failed:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

// PATCH: Обновление товара
export async function PATCH(req: NextRequest) {
  try {
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Starting request');

    // Проверка CSRF-токена
    const csrfToken = req.headers.get('X-CSRF-Token');
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: CSRF Token:', csrfToken);
    if (!csrfToken) {
      process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: CSRF token missing');
      return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
    }

    // Проверка сессии администратора
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Checking admin session');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://keytoheart.ru';
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Base URL for admin-session:', baseUrl);
    const sessionRes = await fetch(new URL('/api/admin-session', baseUrl), {
      headers: { cookie: req.headers.get('cookie') || '' },
    });
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Admin session response status:', sessionRes.status);

    const sessionData = await sessionRes.json();
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Admin session response data:', sessionData);
    if (!sessionRes.ok || !sessionData.success) {
      process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Admin session check failed:', sessionData);
      return NextResponse.json(
        { error: 'Доступ запрещён: требуется роль администратора' },
        { status: 403 }
      );
    }

    // Парсинг тела запроса
    const body: ProductData = await req.json();
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Received payload:', body);

    // Валидация входных данных
    if (!body.id || isNaN(body.id)) {
      process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Invalid ID:', body.id);
      return NextResponse.json({ error: 'ID обязателен и должен быть числом' }, { status: 400 });
    }
    if (!body.title || body.title.trim().length < 3) {
      process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Invalid title:', body.title);
      return NextResponse.json({ error: 'Название должно быть ≥ 3 символов' }, { status: 400 });
    }
    if (!body.price || body.price <= 0) {
      process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Invalid price:', body.price);
      return NextResponse.json({ error: 'Цена должна быть > 0' }, { status: 400 });
    }
    if (body.original_price !== undefined && body.original_price <= 0) {
      process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Invalid original_price:', body.original_price);
      return NextResponse.json(
        { error: 'Старая цена должна быть > 0, если указана' },
        { status: 400 }
      );
    }
    if (!body.category_ids || !Array.isArray(body.category_ids) || body.category_ids.length === 0) {
      process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Invalid category_ids:', body.category_ids);
      return NextResponse.json({ error: 'Необходимо указать хотя бы одну категорию' }, { status: 400 });
    }
    if (
      body.discount_percent &&
      (body.discount_percent < 0 || body.discount_percent > 100 || !Number.isInteger(body.discount_percent))
    ) {
      process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Invalid discount_percent:', body.discount_percent);
      return NextResponse.json({ error: 'Скидка должна быть целым числом от 0 до 100%' }, { status: 400 });
    }

    const productId = body.id;

    // Проверка существования товара
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Checking if product exists');
    let existingProduct;
    try {
      existingProduct = await prisma.products.findUnique({
        where: { id: productId },
        select: { id: true },
      });
    } catch (productCheckError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('PATCH /api/products: Product lookup error:', productCheckError);
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    if (!existingProduct) {
      process.env.NODE_ENV !== "production" && console.error('PATCH /api/products: Product not found');
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }
    process.env.NODE_ENV !== "production" &&
      console.log('PATCH /api/products: Product exists:', existingProduct);

    // Валидация категорий
    process.env.NODE_ENV !== "production" &&
      console.log('PATCH /api/products: Validating categories');
    let categoriesData;
    try {
      categoriesData = await prisma.categories.findMany({
        where: { id: { in: body.category_ids } },
        select: { id: true },
      });
    } catch (categoriesError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('PATCH /api/products: Categories validation failed:', categoriesError);
      return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
    }

    if (!categoriesData || categoriesData.length !== body.category_ids.length) {
      process.env.NODE_ENV !== "production" &&
        console.error('PATCH /api/products: Categories validation failed: count mismatch');
      return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
    }
    process.env.NODE_ENV !== "production" &&
      console.log('PATCH /api/products: Categories validated:', categoriesData);

    // Валидация подкатегорий
    let finalSubcategoryIds: number[] = [];
    if (body.subcategory_ids && body.subcategory_ids.length > 0) {
      process.env.NODE_ENV !== "production" &&
        console.log('PATCH /api/products: Validating subcategories');
      let subcategoriesData;
      try {
        subcategoriesData = await prisma.subcategories.findMany({
          where: { id: { in: body.subcategory_ids } },
          select: { id: true, category_id: true },
        });
      } catch (subcategoriesError: any) {
        process.env.NODE_ENV !== "production" &&
          console.error('PATCH /api/products: Subcategories validation failed:', subcategoriesError);
        return NextResponse.json({ error: 'Ошибка проверки подкатегорий' }, { status: 400 });
      }
      process.env.NODE_ENV !== "production" &&
        console.log('PATCH /api/products: Subcategories fetched:', subcategoriesData);

      for (const subcategory of subcategoriesData) {
        if (subcategory.category_id === null) {
          process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Subcategory missing category_id:', subcategory.id);
          return NextResponse.json(
            { error: `Подкатегория ${subcategory.id} не имеет связанной категории` },
            { status: 400 }
          );
        }
        if (!body.category_ids.includes(subcategory.category_id)) {
          process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Subcategory does not match category:', subcategory.id);
          return NextResponse.json(
            { error: `Подкатегория ${subcategory.id} не соответствует ни одной из выбранных категорий` },
            { status: 400 }
          );
        }
      }

      finalSubcategoryIds = subcategoriesData.map(sub => sub.id);
      process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Final subcategory IDs:', finalSubcategoryIds);
    }

    // Санитация входных данных
    const sanitizedTitle = sanitize(body.title);
    const sanitizedShortDesc = sanitize(body.short_desc);
    const sanitizedDescription = sanitize(body.description);
    const sanitizedComposition = sanitize(body.composition);
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Sanitized inputs:', {
      title: sanitizedTitle,
      shortDesc: sanitizedShortDesc,
      description: sanitizedDescription,
      composition: sanitizedComposition,
    });

    // Генерация slug
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Generating unique slug');
    const uniqueSlug = await generateUniqueSlug(sanitizedTitle);
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Generated slug:', uniqueSlug);

    // Обновление товара в базе данных
    process.env.NODE_ENV !== "production" &&
      console.log('PATCH /api/products: Updating product in database');
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
      slug: uniqueSlug,
      production_time: body.production_time ?? null,
      bonus: body.bonus ?? 0,
      order_index: body.order_index ?? 0,
    };
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Product payload:', productPayload);

    let productData;
    try {
      productData = await prisma.products.update({
        where: { id: productId },
        data: productPayload,
        select: { id: true },
      });
    } catch (productError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('PATCH /api/products: Prisma update error:', productError);
      return NextResponse.json(
        { error: 'Ошибка обновления товара: ' + productError.message },
        { status: 500 },
      );
    }
    process.env.NODE_ENV !== "production" &&
      console.log('PATCH /api/products: Product updated:', productData);

    // Удаление существующих связей с категориями
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Deleting existing product categories');
    try {
      await prisma.product_categories.deleteMany({ where: { product_id: productId } });
    } catch (deleteCategoryError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('PATCH /api/products: Error deleting product categories:', deleteCategoryError);
      return NextResponse.json(
        { error: 'Ошибка удаления связей с категориями: ' + deleteCategoryError.message },
        { status: 500 },
      );
    }

    // Привязка новых категорий
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Linking new categories');
    const categoryEntries = body.category_ids.map((categoryId) => ({
      product_id: productId,
      category_id: categoryId,
    }));
    try {
      if (categoryEntries.length > 0) {
        await prisma.product_categories.createMany({ data: categoryEntries });
      }
    } catch (categoryLinkError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('PATCH /api/products: Error linking categories:', categoryLinkError);
      return NextResponse.json(
        { error: 'Ошибка привязки категорий: ' + categoryLinkError.message },
        { status: 500 },
      );
    }
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Categories linked:', categoryEntries);

    // Удаление существующих связей с подкатегориями
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Deleting existing product subcategories');
    try {
      await prisma.product_subcategories.deleteMany({ where: { product_id: productId } });
    } catch (deleteSubcategoryError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('PATCH /api/products: Error deleting product subcategories:', deleteSubcategoryError);
      return NextResponse.json(
        { error: 'Ошибка удаления связей с подкатегориями: ' + deleteSubcategoryError.message },
        { status: 500 },
      );
    }

    // Привязка новых подкатегорий
    if (finalSubcategoryIds.length > 0) {
      process.env.NODE_ENV !== "production" &&
        console.log('PATCH /api/products: Linking new subcategories');
      const subcategoryEntries = finalSubcategoryIds.map((subcategoryId) => ({
        product_id: productId,
        subcategory_id: subcategoryId,
      }));
      try {
        await prisma.product_subcategories.createMany({ data: subcategoryEntries });
      } catch (subcategoryLinkError: any) {
        process.env.NODE_ENV !== "production" &&
          console.error('PATCH /api/products: Error linking subcategories:', subcategoryLinkError);
        return NextResponse.json(
          { error: 'Ошибка привязки подкатегорий: ' + subcategoryLinkError.message },
          { status: 500 },
        );
      }
      process.env.NODE_ENV !== "production" &&
        console.log('PATCH /api/products: Subcategories linked:', subcategoryEntries);
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
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Product updated successfully:', response);

    // Инвалидация кэша
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Invalidating cache');
    await invalidate('products');
    await invalidate('/api/popular');
    process.env.NODE_ENV !== "production" && console.log('PATCH /api/products: Cache invalidated');

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('PATCH /api/products: Failed:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE: Удаление товара
export async function DELETE(req: NextRequest) {
  try {
    process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Starting request');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://keytoheart.ru';
    const sessionRes = await fetch(new URL('/api/admin-session', baseUrl), {
      headers: { cookie: req.headers.get('cookie') || '' },
    });
    const sessionData = await sessionRes.json();
    if (!sessionRes.ok || !sessionData.success) {
      process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Admin session check failed:', sessionData);
      return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials are missing');
      return NextResponse.json({ error: 'Supabase credentials are missing' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Product ID to delete:', id);

    if (!id || isNaN(parseInt(id))) {
      process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Invalid ID:', id);
      return NextResponse.json({ error: 'ID обязателен и должен быть числом' }, { status: 400 });
    }

    const productId = parseInt(id);

    process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Deleting product categories');
    try {
      await prisma.product_categories.deleteMany({ where: { product_id: productId } });
    } catch (deleteCategoryError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('DELETE /api/products: Error deleting product categories:', deleteCategoryError);
      return NextResponse.json(
        { error: 'Ошибка удаления связей с категориями: ' + deleteCategoryError.message },
        { status: 500 },
      );
    }

    process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Deleting product subcategories');
    try {
      await prisma.product_subcategories.deleteMany({ where: { product_id: productId } });
    } catch (deleteSubcategoryError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('DELETE /api/products: Error deleting product subcategories:', deleteSubcategoryError);
      return NextResponse.json(
        { error: 'Ошибка удаления связей с подкатегориями: ' + deleteSubcategoryError.message },
        { status: 500 },
      );
    }

    process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Fetching product images');
    let productData;
    try {
      productData = await prisma.products.findUnique({
        where: { id: productId },
        select: { images: true },
      });
    } catch (productError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('DELETE /api/products: Error fetching product:', productError);
      return NextResponse.json(
        { error: 'Ошибка получения товара: ' + productError.message },
        { status: 500 },
      );
    }

    if (productData?.images && productData.images.length > 0) {
      process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Deleting product images:', productData.images);
      const fileNames = productData.images.map((url: string) => decodeURIComponent(url.split('/').pop()!));
      const { error: storageError } = await supabaseAdmin.storage
        .from('product-image')
        .remove(fileNames);

      if (storageError) {
        process.env.NODE_ENV !== "production" && console.error('DELETE /api/products: Error deleting images:', storageError);
        return NextResponse.json({ error: 'Ошибка удаления изображений: ' + storageError.message }, { status: 500 });
      }
      process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Images deleted');
    }

    process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Deleting product');
    try {
      await prisma.products.delete({ where: { id: productId } });
    } catch (deleteError: any) {
      process.env.NODE_ENV !== "production" &&
        console.error('DELETE /api/products: Error deleting product:', deleteError);
      return NextResponse.json(
        { error: 'Ошибка удаления товара: ' + deleteError.message },
        { status: 500 },
      );
    }
    process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Product deleted successfully');

    process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Invalidating cache');
    await invalidate('products');
    await invalidate('/api/popular');
    process.env.NODE_ENV !== "production" && console.log('DELETE /api/products: Cache invalidated');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('DELETE /api/products: Failed:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
