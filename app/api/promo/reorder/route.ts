import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// POST: принимает { order: [{ id, order_index }, ...] }
export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json();

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Некорректный формат данных' }, { status: 400 });
    }

    // Обновляем все order_index (batch update)
    for (const { id, order_index } of order) {
      await supabaseAdmin
        .from('promo_blocks')
        .update({ order_index })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
