import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('bonus_balance')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Ошибка поиска бонусов: ' + (error?.message || 'не найден') },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, bonus_balance: data.bonus_balance });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
