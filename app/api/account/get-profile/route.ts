// ✅ Исправленный: app/api/get-profile/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: true, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    // Проверяем токен
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.error('No token provided in Authorization header');
      return NextResponse.json(
        { success: false, error: 'Ошибка аутентификации. Пожалуйста, войдите заново.' },
        { status: 401 }
      );
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token);
    if (sessionError || !sessionData.user) {
      console.error('Invalid token:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Ошибка аутентификации. Пожалуйста, войдите заново.' },
        { status: 401 }
      );
    }

    const phone = sessionData.user.phone;
    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      console.error('Invalid phone number in session:', phone);
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона в сессии' },
        { status: 400 }
      );
    }

    // Получаем профиль
    const { data, error } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Если записи нет, создаём новую
        const { error: upsertError } = await supabase
          .from('user_profiles')
          .upsert(
            { phone, name: null, updated_at: new Date().toISOString() },
            { onConflict: 'phone' }
          );

        if (upsertError) {
          console.error('Ошибка создания профиля:', upsertError);
          return NextResponse.json(
            { success: false, error: 'Ошибка создания профиля: ' + upsertError.message },
            { status: 500 }
          );
        }
        return NextResponse.json({ success: true, name: null });
      }
      console.error('Ошибка загрузки профиля:', error);
      return NextResponse.json(
        { success: false, error: 'Ошибка загрузки профиля: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, name: data.name || null });
  } catch (error: any) {
    console.error('Ошибка в get-profile:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}