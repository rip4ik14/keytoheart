import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, invalidate } from '@/lib/supabase/server';

interface ProductData {
  id?: number;
  title: string;
  price: number;
  original_price?: number;
  category_names?: string;
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

// Серверная санитизация
const sanitize = (input: string | undefined): string => {
  if (!input) return '';
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, 5000);
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
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw new Error('Ошибка проверки уникальности slug: ' + error.message);
    }

    if (!data) break;
    uniqueSlug = `${slug}-${counter++}`;
  }

  return uniqueSlug;
};

// Проверка admin сессии
async function checkAdminSession(req: NextRequest) {
  try {
    console.log('[checkAdminSession] Cookies:', req.cookies.getAll());
    const sessionRes = await fetch(new URL('/api/admin-session', req.url), {
      headers: { 
        cookie: req.headers.get('cookie') || '',
      },
      credentials: 'include',
    });
    console.log('[checkAdminSession] Admin session response:', sessionRes.status, await sessionRes.text());
    const sessionData = await sessionRes.json();
    return sessionRes.ok && sessionData.success;
  } catch (error) {
    console.error('[checkAdminSession] Error:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdminSession(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
    }

    const body: ProductData = await req.json();
    console.log('[POST /api/products] Received payload:', body);

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

    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .in('id', body.category_ids);

    if (categoriesError || !categoriesData || categoriesData.length !== body.category_ids.length) {
      console.error('[POST /api/products] Categories validation failed:', categoriesError);
      return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
    }

    let finalSubcategoryIds: number[] = [];
    if (body.subcategory_ids && body.subcategory_ids.length > 0) {
      const { data: subcategoriesData, error: subcategoriesError } = await supabaseAdmin
        .from('subcategories')
        .select('id, category_id')
        .in('id', body.subcategory_ids);

      if (subcategoriesError || !subcategoriesData) {
        console.error('[POST /api/products] Subcategories validation failed:', subcategoriesError);
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

    const sanitizedTitle = sanitize(body.title);
    const sanitizedShortDesc = sanitize(body.short_desc);
    const sanitizedDescription = sanitize(body.description);
    const sanitizedComposition = sanitize(body.composition);

    const uniqueSlug = await generateUniqueSlug(sanitizedTitle);

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
      console.error('[POST /api/products] Product creation error:', productError);
      return NextResponse.json({ error: 'Ошибка создания товара: ' + productError.message }, { status: 500 });
    }

    const productId = productData.id;

    const categoryEntries = body.category_ids.map(categoryId => ({
      product_id: productId,
      category_id: categoryId,
    }));
    
    const { error: categoryLinkError } = await supabaseAdmin
      .from('product_categories')
      .insert(categoryEntries);

    if (categoryLinkError) {
      console.error('[POST /api/products] Error linking categories:', categoryLinkError);
      return NextResponse.json({ error: 'Ошибка привязки категорий: ' + categoryLinkError.message }, { status: 500 });
    }

    if (finalSubcategoryIds.length > 0) {
      const subcategoryEntries = finalSubcategoryIds.map(subcategoryId => ({
        product_id: productId,
        subcategory_id: subcategoryId,
      }));
      
      const { error: subcategoryLinkError } = await supabaseAdmin
        .from('product_subcategories')
        .insert(subcategoryEntries);

      if (subcategoryLinkError) {
        console.error('[POST /api/products] Error linking subcategories:', subcategoryLinkError);
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

    console.log('[POST /api/products] Product created successfully:', response);
    
    await invalidate('products');
    await invalidate('/api/popular');
    
    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('[POST /api/products] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера: ' + error.message 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await checkAdminSession(req);
    if (!isAdmin) {
      console.warn('[PATCH /api/products] Admin session check failed');
      return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
    }

    const body: ProductData = await req.json();
    console.log('[PATCH /api/products] Received payload:', body);

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

    const { data: existingProduct, error: checkError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', body.id)
      .single();

    if (checkError || !existingProduct) {
      console.error('[PATCH /api/products] Product not found:', checkError);
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .in('id', body.category_ids);

    if (categoriesError || !categoriesData || categoriesData.length !== body.category_ids.length) {
      console.error('[PATCH /api/products] Categories validation failed:', categoriesError);
      return NextResponse.json({ error: 'Одна или несколько категорий не найдены' }, { status: 400 });
    }

    let finalSubcategoryIds: number[] = [];
    if (body.subcategory_ids && body.subcategory_ids.length > 0) {
      const { data: subcategoriesData, error: subcategoriesError } = await supabaseAdmin
        .from('subcategories')
        .select('id, category_id')
        .in('id', body.subcategory_ids);

      if (subcategoriesError || !subcategoriesData) {
        console.error('[PATCH /api/products] Subcategories validation failed:', subcategoriesError);
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

    const sanitizedTitle = sanitize(body.title);
    const sanitizedShortDesc = sanitize(body.short_desc);
    const sanitizedDescription = sanitize(body.description);
    const sanitizedComposition = sanitize(body.composition);

    const uniqueSlug = await generateUniqueSlug(sanitizedTitle, body.id);

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
      console.error('[PATCH /api/products] Product update error:', productError);
      return NextResponse.json({ error: 'Ошибка обновления товара: ' + productError.message }, { status: 500 });
    }

    const productId = productData.id;

    await supabaseAdmin.from('product_categories').delete().eq('product_id', productId);
    await supabaseAdmin.from('product_subcategories').delete().eq('product_id', productId);

    const categoryEntries = body.category_ids.map(categoryId => ({
      product_id: productId,
      category_id: categoryId,
    }));
    
    const { error: categoryLinkError } = await supabaseAdmin
      .from('product_categories')
      .insert(categoryEntries);

    if (categoryLinkError) {
      console.error('[PATCH /api/products] Error linking categories:', categoryLinkError);
      return NextResponse.json({ error: 'Ошибка привязки категорий: ' + categoryLinkError.message }, { status: 500 });
    }

    if (finalSubcategoryIds.length > 0) {
      const subcategoryEntries = finalSubcategoryIds.map(subcategoryId => ({
        product_id: productId,
        subcategory_id: subcategoryId,
      }));
      
      const { error: subcategoryLinkError } = await supabaseAdmin
        .from('product_subcategories')
        .insert(subcategoryEntries);

      if (subcategoryLinkError) {
        console.error('[PATCH /api/products] Error linking subcategories:', subcategoryLinkError);
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

    console.log('[PATCH /api/products] Product updated successfully:', response);
    
    await invalidate('products');
    await invalidate('/api/popular');
    
    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('[PATCH /api/products] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await checkAdminSession(req);
    if (!isAdmin) {
      console.warn('[DELETE /api/products] Admin session check failed');
      return NextResponse.json({ error: 'Доступ запрещён: требуется роль администратора' }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    const { data: productData, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('images')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('[DELETE /api/products] Error fetching product:', fetchError);
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

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
          console.error('[DELETE /api/products] Error deleting images:', storageError);
        }
      } catch (imageError) {
        console.error('[DELETE /api/products] Error processing images:', imageError);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error) {
      console.error('[DELETE /api/products] Product deletion error:', error);
      return NextResponse.json({ error: 'Ошибка удаления товара: ' + error.message }, { status: 500 });
    }

    console.log('[DELETE /api/products] Product deleted successfully:', data);
    
    await invalidate('products');
    await invalidate('/api/popular');
    
    return NextResponse.json({ success: true, id: data.id });

  } catch (error: any) {
    console.error('[DELETE /api/products] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера: ' + error.message 
    }, { status: 500 });
  }
}