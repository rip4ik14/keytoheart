import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      console.error(`[${new Date().toISOString()}] Invalid phone format: ${phone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bonuses')
      .select('bonus_balance, level')
      .eq('phone', phone)
      .single();

    console.log(`[${new Date().toISOString()}] Bonuses check response:`, { data, error });

    if (error || !data) {
      console.error(`[${new Date().toISOString()}] Bonuses fetch error:`, error?.message);
      return NextResponse.json(
        { success: false, error: 'Ошибка поиска бонусов: ' + (error?.message || 'не найден') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bonus_balance: data.bonus_balance ?? 0,
      level: data.level ?? 'basic',
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Server error in checkbonuses:`, error.message);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}