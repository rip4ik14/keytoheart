import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: true, persistSession: false } }
);

export async function POST(request: Request) {
  console.log(`[${new Date().toISOString()}] Webhook called: ${request.method} ${request.url}`);

  try {
    const contentType = request.headers.get('content-type') || '';
    console.log(`[${new Date().toISOString()}] Webhook Content-Type:`, contentType);

    let check_id: string | null = null;
    let check_status: string | null = null;
    let phone: string | null = null;

    // Обработка multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      console.log(`[${new Date().toISOString()}] Attempting to parse multipart/form-data`);
      const formData = await request.formData();
      console.log(`[${new Date().toISOString()}] FormData parsed successfully`);

      console.log(`[${new Date().toISOString()}] FormData entries:`);
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      check_id = formData.get('check_id')?.toString() || null;
      check_status = formData.get('check_status')?.toString() || null;
      phone = formData.get('phone')?.toString() || null;
    }
    // Обработка application/x-www-form-urlencoded
    else if (contentType.includes('application/x-www-form-urlencoded')) {
      console.log(`[${new Date().toISOString()}] Attempting to parse urlencoded data`);
      const text = await request.text();
      console.log(`[${new Date().toISOString()}] Raw body (urlencoded):`, text);
      const params = new URLSearchParams(text);
      check_id = params.get('check_id');
      check_status = params.get('check_status');
      phone = params.get('phone');
    }
    // Обработка application/json
    else if (contentType.includes('application/json')) {
      console.log(`[${new Date().toISOString()}] Attempting to parse JSON data`);
      const body = await request.json();
      console.log(`[${new Date().toISOString()}] Raw body (json):`, body);
      check_id = body.check_id?.toString() || null;
      check_status = body.check_status?.toString() || null;
      phone = body.phone?.toString() || null;
    } else {
      console.error(`[${new Date().toISOString()}] Unsupported Content-Type:`, contentType);
      const text = await request.text();
      console.log(`[${new Date().toISOString()}] Raw body:`, text);
      return new NextResponse('Unsupported Content-Type', { status: 400 });
    }

    console.log(`[${new Date().toISOString()}] Extracted webhook data:`, { check_id, check_status, phone });

    if (!check_id || !check_status) {
      console.error(`[${new Date().toISOString()}] Invalid webhook data:`, { check_id, check_status });
      return new NextResponse('Invalid webhook data', { status: 400 });
    }

    // Проверяем auth_logs для получения телефона, если он не передан
    if (!phone) {
      const { data: authLog, error: logError } = await supabase
        .from('auth_logs')
        .select('phone')
        .eq('check_id', check_id)
        .single();

      if (logError || !authLog) {
        console.error(`[${new Date().toISOString()}] Error fetching auth_log:`, logError);
        return new NextResponse('Auth log not found', { status: 404 });
      }
      phone = authLog.phone;
    }

    // Обновляем статус и создаём сессию при check_status = '401'
    if (check_status === '401') {
      console.log(`[${new Date().toISOString()}] Updating auth_logs for check_id: ${check_id}`);
      const { error: updateError } = await supabase
        .from('auth_logs')
        .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
        .eq('check_id', check_id);

      if (updateError) {
        console.error(`[${new Date().toISOString()}] Error updating auth_logs:`, updateError);
        return new NextResponse('Error updating status', { status: 500 });
      }

      // Проверяем или создаём пользователя
      console.log(`[${new Date().toISOString()}] Проверка существования пользователя с телефоном: ${phone}`);
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Ошибка при получении списка пользователей:', listError);
        return new NextResponse('Error fetching users', { status: 500 });
      }

      const formattedPhone = `+${phone}`;
      let user = users.users.find((u: any) => u.phone === formattedPhone);

      if (!user) {
        console.log(`[${new Date().toISOString()}] Пользователь не существует, создаём нового для телефона: ${phone}`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: formattedPhone,
          phone_confirm: true,
          user_metadata: { phone: formattedPhone },
          email: `${phone}@temp.example.com`,
          email_confirm: true,
        });

        if (createError) {
          console.error('Ошибка создания пользователя:', createError);
          if (createError.message.includes('Phone number already registered')) {
            console.log(`[${new Date().toISOString()}] Пользователь уже зарегистрирован, повторный поиск`);
            const { data: retryUsers, error: retryError } = await supabase.auth.admin.listUsers();
            if (retryError) {
              console.error('Ошибка при повторном поиске пользователей:', retryError);
              return new NextResponse('Error fetching users', { status: 500 });
            }
            user = retryUsers.users.find((u: any) => u.phone === formattedPhone);
            if (!user) {
              console.error('Пользователь не найден даже после повторного поиска');
              return new NextResponse('Error creating user', { status: 500 });
            }
          } else {
            return new NextResponse('Error creating user', { status: 500 });
          }
        } else {
          user = newUser.user;
          console.log(`[${new Date().toISOString()}] Пользователь успешно создан: ${user.id}`);
        }
      } else {
        console.log(`[${new Date().toISOString()}] Пользователь найден: ${user.id}`);
      }

      // Создаём сессию
      console.log(`[${new Date().toISOString()}] Создаём сессию для пользователя: ${user.id}`);
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${phone}@temp.example.com`,
        options: {
          redirectTo: 'https://keytoheart.ru',
        },
      });

      if (sessionError || !sessionData.properties?.action_link) {
        console.error('Ошибка генерации токена сессии:', sessionError);
        return new NextResponse('Error creating session', { status: 500 });
      }

      const token = sessionData.properties.action_link.split('token=')[1]?.split('&')[0];
      if (!token) {
        console.error('Не удалось извлечь токен из magic link');
        return new NextResponse('Error creating session', { status: 500 });
      }

      console.log(`[${new Date().toISOString()}] Токен успешно сгенерирован: ${token}`);

      // Устанавливаем сессионный токен в куки
      const response = new NextResponse('100', { status: 200, headers: { 'Content-Type': 'text/plain' } });
      response.cookies.set('sb-access-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: '/',
        sameSite: 'strict',
      });

      console.log(`[${new Date().toISOString()}] Токен успешно установлен в куки: sb-access-token`);
      window.gtag?.('event', 'auth_webhook_success', { event_category: 'auth', phone });
      window.ym?.(12345678, 'reachGoal', 'auth_webhook_success');
      return response;
    } else {
      console.log(`[${new Date().toISOString()}] Received check_status: ${check_status}, no action required`);
      return new NextResponse('100', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Webhook error:`, error.message);
    return new NextResponse('Server error', { status: 500 });
  }
}