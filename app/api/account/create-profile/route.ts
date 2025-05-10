import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    // Валидация входных данных
    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }

    // Создаём или обновляем профиль
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(
        { phone, updated_at: new Date().toISOString() },
        { onConflict: 'phone' }
      );

    if (upsertError) {
      console.error('Ошибка создания профиля:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Ошибка создания профиля: ' + upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка в create-profile:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}