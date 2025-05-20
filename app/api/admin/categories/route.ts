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
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Проверка роли администратора в таблице admins
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('id', data.user.id)
    .single();

  if (adminError || !adminData) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
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
      return new NextResponse(JSON.stringify({ error: 'Name and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase
      .from('categories')
      .insert({ name, slug, is_visible });

    if (error) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PATCH: Обновить категорию
export async function PATCH(request: Request) {
  const authCheck = await checkAdminAuth(request);
  if (authCheck) return authCheck;

  try {
    const { id, name, slug, is_visible } = await request.json();
    if (!id || !name || !slug) {
      return new NextResponse(JSON.stringify({ error: 'ID, name, and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase
      .from('categories')
      .update({ name, slug, is_visible })
      .eq('id', id);

    if (error) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Удалить категорию
export async function DELETE(request: Request) {
  const authCheck = await checkAdminAuth(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await request.json();
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Проверка наличия товаров
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (productsError) {
      return new NextResponse(JSON.stringify({ error: productsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (products?.length) {
      return new NextResponse(
        JSON.stringify({ error: 'Cannot delete category with associated products' }),
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
      return new NextResponse(JSON.stringify({ error: subError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Удаление категории
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}