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

// Проверка авторизации администратора
async function checkAdminAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('No Authorization header or invalid format');
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    console.warn('Invalid token:', token, 'Error:', error?.message);
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid token' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Проверка роли администратора
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('id', data.user.id)
    .single();

  if (adminError || !adminData) {
    console.warn('User is not an admin:', data.user.id, 'Error:', adminError?.message);
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden', message: 'Admin access required' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

// POST: Добавить категорию
export async function POST(request: Request) {
  const authCheck = await checkAdminAuth(request);
  if (authCheck) return authCheck;

  try {
    const { name, slug, is_visible } = await request.json();
    if (!name || !slug) {
      console.warn('Missing required fields:', { name, slug });
      return new NextResponse(
        JSON.stringify({ error: 'Bad Request', message: 'Name and slug are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { error } = await supabase
      .from('categories')
      .insert({ name, slug, is_visible });

    if (error) {
      console.error('Supabase error:', error.message);
      return new NextResponse(
        JSON.stringify({ error: 'Database Error', message: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/categories:', error.message, error.stack);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', message: error.message || 'Unexpected error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// PATCH: Обновить категорию
export async function PATCH(request: Request) {
  const authCheck = await checkAdminAuth(request);
  if (authCheck) return authCheck;

  try {
    const { id, name, slug, is_visible } = await request.json();
    if (!id || !name || !slug) {
      console.warn('Missing required fields:', { id, name, slug });
      return new NextResponse(
        JSON.stringify({ error: 'Bad Request', message: 'ID, name, and slug are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { error } = await supabase
      .from('categories')
      .update({ name, slug, is_visible })
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error.message);
      return new NextResponse(
        JSON.stringify({ error: 'Database Error', message: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/categories:', error.message, error.stack);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', message: error.message || 'Unexpected error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// DELETE: Удалить категорию
export async function DELETE(request: Request) {
  const authCheck = await checkAdminAuth(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await request.json();
    if (!id) {
      console.warn('Missing ID');
      return new NextResponse(
        JSON.stringify({ error: 'Bad Request', message: 'ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Проверка наличия товаров
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (productsError) {
      console.error('Supabase error (products check):', productsError.message);
      return new NextResponse(
        JSON.stringify({ error: 'Database Error', message: productsError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (products?.length) {
      console.warn('Category has associated products:', id);
      return new NextResponse(
        JSON.stringify({ error: 'Bad Request', message: 'Cannot delete category with associated products' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Удаление подкатегорий
    const { error: subError } = await supabase
      .from('subcategories')
      .delete()
      .eq('category_id', id);

    if (subError) {
      console.error('Supabase error (subcategories deletion):', subError.message);
      return new NextResponse(
        JSON.stringify({ error: 'Database Error', message: subError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Удаление категории
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error (category deletion):', error.message);
      return new NextResponse(
        JSON.stringify({ error: 'Database Error', message: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/categories:', error.message, error.stack);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', message: error.message || 'Unexpected error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}