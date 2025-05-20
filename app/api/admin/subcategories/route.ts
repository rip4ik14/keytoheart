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
  console.log(`[${new Date().toISOString()}] Handling OPTIONS request to /api/admin/subcategories`);
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// POST: Добавить подкатегорию
export async function POST(request: Request) {
  console.log(`[${new Date().toISOString()}] Incoming POST request to /api/admin/subcategories:`, {
    method: request.method,
    headers: Object.fromEntries(new Headers(request.headers)),
    body: await request.text(),
  });

  try {
    const { category_id, name, slug, is_visible } = await request.json();
    if (!category_id || !name || !slug) {
      console.warn(`[${new Date().toISOString()}] Missing required fields:`, { category_id, name, slug });
      return NextResponse.json(
        { error: 'Bad Request', message: 'Category ID, name, and slug are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { error } = await supabase
      .from('subcategories')
      .insert({ category_id, name, slug, is_visible });

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
    console.log(`[${new Date().toISOString()}] Response from POST /api/admin/subcategories:`, response);
    return response;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in POST /api/admin/subcategories:`, error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Unexpected error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH: Обновить подкатегорию
export async function PATCH(request: Request) {
  console.log(`[${new Date().toISOString()}] Incoming PATCH request to /api/admin/subcategories:`, {
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
      .from('subcategories')
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
    console.log(`[${new Date().toISOString()}] Response from PATCH /api/admin/subcategories:`, response);
    return response;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in PATCH /api/admin/subcategories:`, error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Unexpected error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE: Удалить подкатегорию
export async function DELETE(request: Request) {
  console.log(`[${new Date().toISOString()}] Incoming DELETE request to /api/admin/subcategories:`, {
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

    const { error } = await supabase
      .from('subcategories')
      .delete()
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
    console.log(`[${new Date().toISOString()}] Response from DELETE /api/admin/subcategories:`, response);
    return response;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in DELETE /api/admin/subcategories:`, error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Unexpected error' },
      { status: 500, headers: corsHeaders }
    );
  }
}