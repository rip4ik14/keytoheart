// ✅ Путь: app/api/promo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

// Только сервер: не используем NEXT_PUBLIC_ для Service Role!
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Получить все промо-блоки
export async function GET() {
  const { data, error } = await supabase
    .from('promo_blocks')
    .select('*')
    .order('order_index');

  if (error) {
    process.env.NODE_ENV !== "production" && console.error('Supabase promo_blocks GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// Создать промо-блок
export async function POST(req: NextRequest) {
  try {
    const { title, subtitle, button_text, href, image_url, type, order_index } = await req.json();
    const { data, error } = await supabase
      .from('promo_blocks')
      .insert([{ title, subtitle, button_text, href, image_url, type, order_index }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('Supabase promo_blocks POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Обновить промо-блок
export async function PATCH(req: NextRequest) {
  try {
    const { id, title, subtitle, button_text, href, image_url, type, order_index } = await req.json();
    const { data, error } = await supabase
      .from('promo_blocks')
      .update({ title, subtitle, button_text, href, image_url, type, order_index })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('Supabase promo_blocks PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Удалить промо-блок
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    const { error } = await supabase
      .from('promo_blocks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('Supabase promo_blocks DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
