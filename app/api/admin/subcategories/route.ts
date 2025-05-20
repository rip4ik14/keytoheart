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

// POST: Добавить подкатегорию
export async function POST(request: Request) {
  const authCheck = await checkAdminAuth(request);
  if (authCheck) return authCheck;

  try {
    const { category_id, name, slug, is_visible } = await request.json();
    if (!category_id || !name || !slug) {
      console.warn('Missing required fields:', { category_id, name, slug });
      return new NextResponse(
        JSON.stringify({ error: 'Bad Request', message: 'Category ID, name, and slug are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { error } = await supabase
      .from('subcategories')
      .insert({ category_id, name, slug, is_visible });

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
    console.error('Error in POST /api/admin/subcategories:', error.message, error.stack);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', message: error.message || 'Unexpected error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// PATCH: Обновить подкатегорию
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
      .from('subcategories')
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
    console.error('Error in PATCH /api/admin/subcategories:', error.message, error.stack);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', message: error.message || 'Unexpected error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// DELETE: Удалить подкатегорию
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

    const { error } = await supabase
      .from('subcategories')
      .delete()
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
  console.error('Error in DELETE /api/admin/subcategories:', error.message, error.stack);
  return new NextResponse(
    JSON.stringify({ error: 'Internal Server Error', message: error.message || 'Unexpected error' }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
}