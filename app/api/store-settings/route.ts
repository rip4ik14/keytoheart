import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .single();

    if (error) {
      process.env.NODE_ENV !== "production" && console.error('Supabase error in store-settings:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Настройки не найдены' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        order_acceptance_enabled: data.order_acceptance_enabled ?? false,
        banner_message: data.banner_message ?? null,
        banner_active: data.banner_active ?? false,
        order_acceptance_schedule: data.order_acceptance_schedule ?? {},
        store_hours: data.store_hours ?? {},
      },
    });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error in store-settings API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}