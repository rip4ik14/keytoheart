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

// POST: Добавить подкатегорию
export async function POST(request: Request) {
  try {
    const { category_id, name, slug, is_visible } = await request.json();
    if (!category_id || !name || !slug) {
      console.warn('Missing required fields:', { category_id, name, slug });
      return NextResponse.json(
        { error: 'Bad Request', message: 'Category ID, name, and slug are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('subcategories')
      .insert({ category_id, name, slug, is_visible });

    if (error) {
      console.error('Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/subcategories:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}

// PATCH: Обновить подкатегорию
export async function PATCH(request: Request) {
  try {
    const { id, name, slug, is_visible } = await request.json();
    if (!id || !name || !slug) {
      console.warn('Missing required fields:', { id, name, slug });
      return NextResponse.json(
        { error: 'Bad Request', message: 'ID, name, and slug are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('subcategories')
      .update({ name, slug, is_visible })
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/subcategories:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}

// DELETE: Удалить подкатегорию
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      console.warn('Missing ID');
      return NextResponse.json(
        { error: 'Bad Request', message: 'ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/subcategories:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}