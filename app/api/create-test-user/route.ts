// ✅ Путь: app/api/create-test-user/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  try {
    // Генерируем уникальный email и номер телефона с временной меткой
    const timestamp = Date.now();
    const uniqueEmail = `test_${timestamp}@example.com`;
    const uniquePhone = `+7999${timestamp}`; // Уникальный номер телефона

    // Создаём тестового пользователя
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      phone: uniquePhone, // Используем уникальный номер телефона
      email: uniqueEmail, // Используем уникальный email
      password: 'Test123!',
      user_metadata: { phone: uniquePhone },
    });

    if (userError) throw userError;
    if (!user.user) throw new Error('Не удалось создать пользователя');

    // Добавляем важные даты
    await supabase
      .from('important_dates')
      .insert({
        user_id: user.user.id,
        birthday: '1990-05-15',
        anniversary: '2020-06-20',
      });

    // Добавляем бонусы
    await supabase
      .from('bonuses')
      .insert({
        phone: uniquePhone,
        bonus_balance: 500,
        level: 'Gold',
      });

    return NextResponse.json({ success: true, userId: user.user.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}