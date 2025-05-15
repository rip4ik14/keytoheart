// ✅ Исправленный: app/api/update-profile/route.ts
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

    const { name } = await request.json();

    // Валидация входных данных
    if (typeof name !== 'string' || name.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Имя должно быть строкой до 50 символов' },
        { status: 400 }
      );
    }

    // Защита от XSS
    const sanitizedName = name.replace(/[<>&'"]/g, '');

    // Проверим, есть ли профиль
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('phone', phone)
      .single();

    if (existing) {
      // Только обновляем имя, остальные поля не трогаем!
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ name: sanitizedName, updated_at: new Date().toISOString() })
        .eq('phone', phone);

      if (updateError) {
        console.error('Ошибка обновления профиля:', updateError);
        return NextResponse.json(
          { success: false, error: 'Ошибка обновления профиля: ' + updateError.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    } else {
      // Если профиля нет — создаём с обязательными полями
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([{ phone, name: sanitizedName, updated_at: new Date().toISOString() }]);
      if (insertError) {
        console.error('Ошибка создания профиля:', insertError);
        return NextResponse.json(
          { success: false, error: 'Ошибка создания профиля: ' + insertError.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error('Ошибка в update-profile:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}