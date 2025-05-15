import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone, bonus_balance } = await request.json();

    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }
    if (typeof bonus_balance !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат бонуса' },
        { status: 400 }
      );
    }

    // Только обновляем бонусный баланс!
    const { error } = await supabase
      .from('user_profiles')
      .update({ bonus_balance, updated_at: new Date().toISOString() })
      .eq('phone', phone);

    if (error) {
      console.error('Ошибка обновления бонусов:', error);
      return NextResponse.json(
        { success: false, error: 'Ошибка обновления бонусов: ' + error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка в bonuses:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
