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
    // Парсим multipart/form-data
    const formData = await request.formData();
    const checkId = formData.get('check_id')?.toString();
    const phone = formData.get('phone')?.toString();
    const status = formData.get('status')?.toString();

    console.log(`[${new Date().toISOString()}] Webhook received: checkId=${checkId}, phone=${phone}, status=${status}`);

    if (!checkId || !phone || !status) {
      console.error(`[${new Date().toISOString()}] Отсутствуют обязательные параметры: checkId=${checkId}, phone=${phone}, status=${status}`);
      return NextResponse.json({ success: false, error: 'Отсутствуют обязательные параметры' }, { status: 400 });
    }

    // Обновляем статус в auth_logs
    const { error: logError } = await supabase
      .from('auth_logs')
      .update({ status: status === '401' ? 'VERIFIED' : 'PENDING', updated_at: new Date().toISOString() })
      .eq('check_id', checkId);

    if (logError) {
      console.error(`[${new Date().toISOString()}] Ошибка обновления auth_logs:`, logError);
      return NextResponse.json({ success: false, error: 'Ошибка обновления статуса' }, { status: 500 });
    }

    if (status !== '401') {
      console.log(`[${new Date().toISOString()}] Статус не VERIFIED, пропускаем создание пользователя`);
      return NextResponse.json({ success: true, message: 'Статус обновлён, но пользователь не создан' });
    }

    // Проверяем или создаём пользователя
    console.log(`[${new Date().toISOString()}] Проверка существования пользователя с телефоном: ${phone}`);
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error(`[${new Date().toISOString()}] Ошибка при получении списка пользователей:`, listError.message);
      return NextResponse.json({ success: false, error: 'Ошибка получения списка пользователей' }, { status: 500 });
    }

    let userId: string | undefined;
    let user = users.users.find((u: any) => u.phone === phone);

    if (!user) {
      console.log(`[${new Date().toISOString()}] Пользователь не найден, создаём нового для телефона: ${phone}`);
      const email = `${phone.replace(/\D/g, '')}-${Date.now()}@temp.example.com`;
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone: phone,
        phone_confirm: true,
        user_metadata: { phone: phone },
        email: email,
        email_confirm: true,
      });

      if (createError) {
        console.error(`[${new Date().toISOString()}] Ошибка создания пользователя:`, createError.message);
        if (createError.message.includes('Phone number already registered')) {
          console.log(`[${new Date().toISOString()}] Пользователь уже зарегистрирован, повторный поиск через listUsers`);
          const { data: retryUsers, error: retryError } = await supabase.auth.admin.listUsers();
          if (retryError) {
            console.error(`[${new Date().toISOString()}] Ошибка при повторном поиске пользователей:`, retryError.message);
            return NextResponse.json({ success: false, error: 'Ошибка повторного поиска пользователей' }, { status: 500 });
          }
          user = retryUsers.users.find((u: any) => u.phone === phone);
          if (!user) {
            console.error(`[${new Date().toISOString()}] Пользователь не найден даже после повторного поиска`);
            return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
          }
          userId = user.id;
        } else {
          return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
        }
      } else {
        userId = newUser.user.id;
        console.log(`[${new Date().toISOString()}] Пользователь успешно создан: ${userId}`);
        user = newUser.user;
      }
    } else {
      userId = user.id;
      console.log(`[${new Date().toISOString()}] Пользователь найден: ${userId}`);
    }

    // Создаём профиль в user_profiles, если не существует
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`[${new Date().toISOString()}] Ошибка проверки профиля:`, profileError);
      return NextResponse.json({ success: false, error: 'Ошибка проверки профиля' }, { status: 500 });
    }

    if (!profile) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([{ phone, updated_at: new Date().toISOString() }]);
      if (insertError) {
        console.error(`[${new Date().toISOString()}] Ошибка создания профиля:`, insertError);
        return NextResponse.json({ success: false, error: 'Ошибка создания профиля' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Статус обновлён, пользователь обработан' });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Ошибка в webhook-call:`, error.message, error.stack);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}