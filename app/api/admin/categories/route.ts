import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types_new';

// Инициализация Supabase с service_role ключом
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// Общие CORS-заголовки
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
};

// OPTIONS: Обработка предварительных CORS-запросов
export async function OPTIONS() {
  console.log(`[${new Date().toISOString()}] Handling OPTIONS request to /api/admin/categories`);
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// POST: Добавить категорию
export async function POST(request: Request) {
  console.log(`[${new Date().toISOString()}] Incoming POST request to /api/admin/categories:`, {
    method: request.method,
    headers: Object.fromEntries(new Headers(request.headers)),
    body: await request.text(),
  });

  try {
    const { name, slug, is_visible } = await request.json();
    if (!name || !slug) {
      console.warn(`[${new Date().toISOString()}] Missing required fields:`, { name, slug });
      return NextResponse.json(
        { error: 'Bad Request', message: 'Name and slug are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { error } = await supabase
      .from('categories')
      .insert({ name, slug, is_visible });

    if (error) {
      console.error(`[${new Date().toISOString()}] Supabase error:`, error.message);
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const response = NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    );
    console.log(`[${new Date().toISOString()}] Response from POST /api/admin/categories:`, response);
    return response;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in POST /api/admin/categories:`, error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Unexpected error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH: Обновить категорию
export async function PATCH(request: Request) {
  console.log(`[${new Date().toISOString()}] Incoming PATCH request to /api/admin/categories:`, {
    method: request.method,
    headers: Object.fromEntries(new Headers(request.headers)),
    body: await request.text(),
  });

  try {
    const { id, name, slug, is_visible } = await request.json();
    if (!id || !name || !slug) {
      console.warn(`[${new Date().toISOString()}] Missing required fields:`, { id, name, slug });
      return NextResponse.json(
        { error: 'Bad Request', message: 'ID, name, and slug are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { error } = await supabase
      .from('categories')
      .update({ name, slug, is_visible })
      .eq('id', id);

    if (error) {
      console.error(`[${new Date().toISOString()}] Supabase error:`, error.message);
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const response = NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    );
    console.log(`[${new Date().toISOString()}] Response from PATCH /api/admin/categories:`, response);
    return response;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in PATCH /api/admin/categories:`, error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Unexpected error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE: Удалить категорию
export async function DELETE(request: Request) {
  console.log(`[${new Date().toISOString()}] Incoming DELETE request to /api/admin/categories:`, {
    method: request.method,
    headers: Object.fromEntries(new Headers(request.headers)),
    body: await request.text(),
  });

  try {
    const { id } = await request.json();
    if (!id) {
      console.warn(`[${new Date().toISOString()}] Missing ID`);
      return NextResponse.json(
        { error: 'Bad Request', message: 'ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Проверка наличия товаров
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (productsError) {
      console.error(`[${new Date().toISOString()}] Supabase error (products check):`, productsError.message);
      return NextResponse.json(
        { error: 'Database Error', message: productsError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    if (products?.length) {
      console.warn(`[${new Date().toISOString()}] Category has associated products:`, id);
      return NextResponse.json(
        { error: 'Bad Request', message: 'Cannot delete category with associated products' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Удаление подкатегорий
    const { error: subError } = await supabase
      .from('subcategories')
      .delete()
      .eq('category_id', id);

    if (subError) {
      console.error(`[${new Date().toISOString()}] Supabase error (subcategories deletion):`, subError.message);
      return NextResponse.json(
        { error: 'Database Error', message: subError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    // Удаление категории
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[${new Date().toISOString()}] Supabase error (category deletion):`, error.message);
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const response = NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    );
    console.log(`[${new Date().toISOString()}] Response from DELETE /api/admin/categories:`, response);
    return response;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in DELETE /api/admin/categories:`, error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Unexpected error' },
      { status: 500, headers: corsHeaders }
    );
  }
}