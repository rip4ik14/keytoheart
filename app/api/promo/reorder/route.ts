// ✅ Путь: app/api/promo/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json();

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Некорректный формат данных' }, { status: 400 });
    }

    // Обновляем order_index в Supabase
    const updates = order.map(({ id, order_index }: { id: number; order_index: number }) =>
      supabaseAdmin
        .from('promo_blocks')
        .update({ order_index })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(errors[0].error?.message || 'Ошибка обновления порядка');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error in /api/promo/reorder:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}