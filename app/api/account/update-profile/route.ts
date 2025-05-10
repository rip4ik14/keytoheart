import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone, name } = await request.json();

    // Валидация входных данных
    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Имя должно быть строкой до 50 символов' },
        { status: 400 }
      );
    }

    // Защита от XSS
    const sanitizedName = name.replace(/[<>&'"]/g, '');

    // Обновляем профиль
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(
        { phone, name: sanitizedName, updated_at: new Date().toISOString() },
        { onConflict: 'phone' }
      );

    if (upsertError) {
      console.error('Ошибка обновления профиля:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Ошибка обновления профиля: ' + upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка в update-profile:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}