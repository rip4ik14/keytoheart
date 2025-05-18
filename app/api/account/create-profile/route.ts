import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone, name } = await request.json();

    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя в auth.users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error(`[${new Date().toISOString()}] Ошибка при получении списка пользователей:`, listError.message);
      return NextResponse.json(
        { success: false, error: 'Ошибка проверки пользователя: ' + listError.message },
        { status: 500 }
      );
    }

    const userExists = users.users.some((u: any) => u.phone === phone);
    if (!userExists) {
      console.log(`[${new Date().toISOString()}] Пользователь с телефоном ${phone} не найден в auth.users`);
      return NextResponse.json(
        { success: false, error: 'Пользователь не зарегистрирован в системе' },
        { status: 404 }
      );
    }

    // Имя не обязательно, но если есть — чистим от XSS
    const sanitizedName = typeof name === 'string' ? name.replace(/[<>&'"]/g, '') : null;

    // Создаём профиль только если не существует
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('phone', phone)
      .single();

    if (existing) {
      return NextResponse.json({ success: true }); // Уже создан
    }

    const { error } = await supabase
      .from('user_profiles')
      .insert([{ phone, name: sanitizedName, updated_at: new Date().toISOString() }]);
    if (error) {
      console.error('Ошибка создания профиля:', error);
      return NextResponse.json(
        { success: false, error: 'Ошибка создания профиля: ' + error.message },
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