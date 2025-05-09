import { NextRequest, NextResponse } from 'next/server';
import { createClient, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  const DEV_PHONE = process.env.NEXT_PUBLIC_DEV_PHONE || '+79180300643';

  if (!phone || phone !== DEV_PHONE) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Конфигурация Supabase отсутствует' }, { status: 500 });
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
  if (fetchError) {
    return NextResponse.json({ error: 'Ошибка получения пользователей' }, { status: 500 });
  }

  const existingUser = users.users.find((user: User) => user.phone === phone);
  let userId: string;

  if (!existingUser) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      phone,
      user_metadata: { phone },
      // Убираем phone_confirmed, так как это свойство не поддерживается в AdminUserAttributes
      // Подтверждение телефона будет обрабатываться на стороне клиента при входе
    });
    if (createError || !newUser?.user?.id) {
      return NextResponse.json({ error: 'Ошибка создания пользователя' }, { status: 500 });
    }
    userId = newUser.user.id;
  } else {
    userId = existingUser.id;
  }

  // Метод createSession устарел. Вместо этого возвращаем userId для создания сессии на клиенте
  return NextResponse.json({
    success: true,
    user_id: userId,
    message: 'Используйте user_id для создания сессии на клиенте с помощью signInWithOtp или другого метода',
  }, { status: 200 });
}