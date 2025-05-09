// Путь: app/api/admin/update-order-status/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || typeof status !== 'string') {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error("Ошибка обновления статуса:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
