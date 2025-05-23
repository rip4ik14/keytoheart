import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminJwt } from '@/lib/auth';
import { Database } from '@/lib/supabase/types_new';

export async function POST(req: NextRequest) {
  try {
    // Проверка авторизации
    const token = req.cookies.get('admin_session')?.value;
    if (!token || !verifyAdminJwt(token)) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 403 });
    }

    // Проверка CSRF-токена
    const csrfToken = req.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      return NextResponse.json({ error: 'CSRF-токен отсутствует' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title, price, original_price, discount_percent, category_names, category_ids,
      subcategory_ids, production_time, short_desc, description, composition,
      bonus, images, in_stock, is_visible, is_popular, order_index
    } = body;

    // Валидация входных данных
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json({ error: 'Название должно быть строкой длиной ≥ 3 символов' }, { status: 400 });
    }
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'Цена должна быть числом > 0' }, { status: 400 });
    }
    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return NextResponse.json({ error: 'Необходимо выбрать хотя бы одну категорию' }, { status: 400 });
    }

    // Вставка товара
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        title: title.trim(),
        price,
        original_price: original_price ?? price,
        discount_percent: discount_percent ?? 0,
        production_time: production_time ?? null,
        short_desc: short_desc?.trim() || null,
        description: description?.trim() || null,
        composition: composition?.trim() || null,
        bonus: bonus ?? 0,
        images: images ?? [],
        in_stock: in_stock ?? true,
        is_visible: is_visible ?? true,
        is_popular: is_popular ?? false,
        order_index: order_index ?? 0,
      })
      .select('id')
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: productError?.message || 'Ошибка создания товара' }, { status: 500 });
    }

    // Вставка связей с категориями
    const categoryInserts = category_ids.map((category_id: number) => ({
      product_id: product.id,
      category_id,
    }));
    const { error: categoryError } = await supabaseAdmin.from('product_categories').insert(categoryInserts);
    if (categoryError) {
      await supabaseAdmin.from('products').delete().eq('id', product.id);
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }

    // Вставка связей с подкатегориями
    if (subcategory_ids?.length > 0) {
      const subcategoryInserts = subcategory_ids.map((subcategory_id: number) => ({
        product_id: product.id,
        subcategory_id,
      }));
      const { error: subcategoryError } = await supabaseAdmin.from('product_subcategories').insert(subcategoryInserts);
      if (subcategoryError) {
        await supabaseAdmin.from('product_categories').delete().eq('product_id', product.id);
        await supabaseAdmin.from('products').delete().eq('id', product.id);
        return NextResponse.json({ error: subcategoryError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, product_id: product.id }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/products error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Проверка авторизации
    const token = req.cookies.get('admin_session')?.value;
    if (!token || !verifyAdminJwt(token)) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 403 });
    }

    // Проверка CSRF-токена
    const csrfToken = req.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      return NextResponse.json({ error: 'CSRF-токен отсутствует' }, { status: 403 });
    }

    const body = await req.json();
    const {
      id, title, price, original_price, discount_percent, category_names, category_ids,
      subcategory_ids, production_time, short_desc, description, composition,
      bonus, images, in_stock, is_visible, is_popular, order_index
    } = body;

    // Валидация
    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: 'ID товара обязателен и должен быть числом' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json({ error: 'Название должно быть строкой длиной ≥ 3 символов' }, { status: 400 });
    }
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'Цена должна быть числом > 0' }, { status: 400 });
    }
    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return NextResponse.json({ error: 'Необходимо выбрать хотя бы одну категорию' }, { status: 400 });
    }

    // Обновление товара
    const { error: productError } = await supabaseAdmin
      .from('products')
      .update({
        title: title.trim(),
        price,
        original_price: original_price ?? price,
        discount_percent: discount_percent ?? 0,
        production_time: production_time ?? null,
        short_desc: short_desc?.trim() || null,
        description: description?.trim() || null,
        composition: composition?.trim() || null,
        bonus: bonus ?? 0,
        images: images ?? [],
        in_stock: in_stock ?? true,
        is_visible: is_visible ?? true,
        is_popular: is_popular ?? false,
        order_index: order_index ?? 0,
      })
      .eq('id', id);

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    // Удаление старых связей с категориями
    const { error: deleteCategoryError } = await supabaseAdmin.from('product_categories').delete().eq('product_id', id);
    if (deleteCategoryError) {
      return NextResponse.json({ error: deleteCategoryError.message }, { status: 500 });
    }

    // Вставка новых связей с категориями
    const categoryInserts = category_ids.map((category_id: number) => ({
      product_id: id,
      category_id,
    }));
    const { error: categoryError } = await supabaseAdmin.from('product_categories').insert(categoryInserts);
    if (categoryError) {
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }

    // Удаление старых связей с подкатегориями
    const { error: deleteSubcategoryError } = await supabaseAdmin.from('product_subcategories').delete().eq('product_id', id);
    if (deleteSubcategoryError) {
      return NextResponse.json({ error: deleteSubcategoryError.message }, { status: 500 });
    }

    // Вставка новых связей с подкатегориями
    if (subcategory_ids?.length > 0) {
      const subcategoryInserts = subcategory_ids.map((subcategory_id: number) => ({
        product_id: id,
        subcategory_id,
      }));
      const { error: subcategoryError } = await supabaseAdmin.from('product_subcategories').insert(subcategoryInserts);
      if (subcategoryError) {
        return NextResponse.json({ error: subcategoryError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('PATCH /api/products error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}