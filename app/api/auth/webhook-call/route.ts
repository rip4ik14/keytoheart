import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: true, persistSession: false } }
);

async function findUserByPhone(phone: string) {
  const res = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/admin/users?phone=${encodeURIComponent(phone)}`,
    {
      headers: {
        apiKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  );

  const json = await res.json();
  return json.users?.[0] || null;
}

export async function POST(request: Request) {
  try {
    console.log(`[${new Date().toISOString()}] Webhook request received:`, {
      headers: Object.fromEntries(request.headers.entries()),
      method: request.method,
    });

    // Попробуем обработать данные в разных форматах
    let checkId: string | undefined;
    let phone: string | undefined;
    let status: string | undefined;

    // Сначала пытаемся обработать как multipart/form-data
    try {
      const formData = await request.formData();
      const formDataEntries = Object.fromEntries(formData.entries());
      console.log(`[${new Date().toISOString()}] Webhook form-data:`, formDataEntries);

      // Проверяем возможные варианты имен полей
      const checkIdValue = formData.get('check_id') || formData.get('checkId') || formData.get('check_id ');
      const phoneValue = formData.get('phone');
      const statusValue = formData.get('status');

      // Преобразуем string | null в string | undefined
      checkId = checkIdValue !== null ? checkIdValue.toString() : undefined;
      phone = phoneValue !== null ? phoneValue.toString() : undefined;
      status = statusValue !== null ? statusValue.toString() : undefined;
    } catch (formError) {
      console.error(`[${new Date().toISOString()}] Ошибка парсинга form-data:`, formError);
    }

    // Если не удалось обработать как form-data, пробуем как JSON
    if (!checkId || !phone || !status) {
      try {
        const jsonData = await request.json();
        console.log(`[${new Date().toISOString()}] Webhook JSON data:`, jsonData);

        checkId = jsonData.check_id || jsonData.checkId || jsonData['check_id '];
        phone = jsonData.phone;
        status = jsonData.status;
      } catch (jsonError) {
        console.error(`[${new Date().toISOString()}] Ошибка парсинга JSON:`, jsonError);
      }
    }

    // Если не удалось извлечь данные, пробуем как текст (для отладки)
    if (!checkId || !phone || !status) {
      try {
        const textData = await request.text();
        console.log(`[${new Date().toISOString()}] Webhook raw text data:`, textData);

        // Попытка извлечь параметры из текста (например, если это query-string формат)
        const params = new URLSearchParams(textData);
        const checkIdValue = params.get('check_id') || params.get('checkId') || params.get('check_id ');
        const phoneValue = params.get('phone');
        const statusValue = params.get('status');

        checkId = checkIdValue !== null ? checkIdValue : undefined;
        phone = phoneValue !== null ? phoneValue : undefined;
        status = statusValue !== null ? statusValue : undefined;
      } catch (textError) {
        console.error(`[${new Date().toISOString()}] Ошибка парсинга текста:`, textError);
      }
    }

    console.log(`[${new Date().toISOString()}] Parsed webhook data: checkId=${checkId}, phone=${phone}, status=${status}`);

    if (!checkId || !phone || !status) {
      console.error(`[${new Date().toISOString()}] Отсутствуют обязательные параметры: checkId=${checkId}, phone=${phone}, status=${status}`);
      return NextResponse.json({ success: false, error: 'Отсутствуют обязательные параметры' }, { status: 400 });
    }

    const newStatus = status === '401' ? 'VERIFIED' : 'PENDING';

    const { error: logError } = await supabase
      .from('auth_logs')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('check_id', checkId);

    if (logError) {
      console.error(`[${new Date().toISOString()}] Ошибка обновления auth_logs:`, logError);
      return NextResponse.json({ success: false, error: 'Ошибка обновления статуса' }, { status: 500 });
    }

    if (newStatus !== 'VERIFIED') {
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