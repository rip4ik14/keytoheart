import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: true, persistSession: false } }
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkId = searchParams.get('checkId');
  const phone = searchParams.get('phone');

  console.log(`[${new Date().toISOString()}] Проверка статуса для checkId: ${checkId}, телефон: ${phone}`);

  try {
    if (!checkId || !phone) {
      console.error(`[${new Date().toISOString()}] Отсутствуют обязательные параметры: checkId=${checkId}, phone=${phone}`);
      return NextResponse.json({ success: false, error: 'Не указаны обязательные параметры' }, { status: 400 });
    }

    // Проверяем статус в auth_logs
    console.log(`[${new Date().toISOString()}] Запрос в auth_logs для checkId: ${checkId}`);
    const { data: authLog, error: logError } = await supabase
      .from('auth_logs')
      .select('status')
      .eq('check_id', checkId)
      .single();

    if (logError || !authLog) {
      console.error(`[${new Date().toISOString()}] Ошибка получения записи из auth_logs:`, logError);
      return NextResponse.json({ success: false, error: 'Запись не найдена' }, { status: 404 });
    }

    console.log(`[${new Date().toISOString()}] Статус из базы данных: ${authLog.status}`);

    if (authLog.status === 'VERIFIED') {
      console.log(`[${new Date().toISOString()}] Статус уже VERIFIED, возвращаем сразу`);
      return NextResponse.json({ success: true, status: 'VERIFIED', message: 'Авторизация завершена' });
    }

    if (authLog.status === 'EXPIRED') {
      console.log(`[${new Date().toISOString()}] Статус EXPIRED, возвращаем сразу`);
      return NextResponse.json({ success: true, status: 'EXPIRED', message: 'Срок действия истёк' });
    }

    // Проверяем статус через SMS.ru API
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] Запрос к SMS.ru API: https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`);
    const res = await fetch(
      `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`,
      { cache: 'no-store' }
    );

    const responseText = await res.text();
    console.log(`[${new Date().toISOString()}] Ответ SMS.ru API (длительность: ${Date.now() - start}ms):`, responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error(`[${new Date().toISOString()}] Ошибка парсинга ответа SMS.ru:`, parseError.message);
      return NextResponse.json({ success: false, error: 'Ошибка ответа от SMS.ru' }, { status: 500 });
    }

    if (!res.ok || data.status !== 'OK') {
      console.error(`[${new Date().toISOString()}] Ошибка SMS.ru API:`, data?.status_text || 'Unknown error');
      return NextResponse.json({ success: false, error: 'Ошибка проверки статуса' }, { status: 500 });
    }

    const checkStatus = data.check_status;

    if (checkStatus === 401) {
      console.log(`[${new Date().toISOString()}] SMS.ru подтвердил верификацию (check_status: 401), обновляем auth_logs`);
      const { error: updateError } = await supabase
        .from('auth_logs')
        .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
        .eq('check_id', checkId);

      if (updateError) {
        console.error(`[${new Date().toISOString()}] Ошибка обновления auth_logs:`, updateError);
        return NextResponse.json({ success: false, error: 'Ошибка обновления статуса' }, { status: 500 });
      }

      // Проверяем или создаём пользователя
      console.log(`[${new Date().toISOString()}] Проверка существования пользователя с телефоном: ${phone}`);
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error(`[${new Date().toISOString()}] Ошибка при получении списка пользователей:`, listError.message, listError);
        return NextResponse.json({ success: false, error: 'Ошибка получения списка пользователей' }, { status: 500 });
      }

      let userId: string | undefined;
      const user = users.users.find((u: any) => u.phone === phone);

      if (!user) {
        console.log(`[${new Date().toISOString()}] Пользователь не найден, создаём нового для телефона: ${phone}`);
        const email = `${phone.replace(/\D/g, '')}-${Date.now()}@temp.example.com`; // Уникальный email с временной меткой
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: phone,
          phone_confirm: true,
          user_metadata: { phone: phone },
          email: email,
          email_confirm: true,
        });

        if (createError) {
          console.error(`[${new Date().toISOString()}] Ошибка создания пользователя:`, createError.message, createError);
          if (createError.message.includes('Phone number already registered')) {
            console.log(`[${new Date().toISOString()}] Пользователь уже зарегистрирован, повторный поиск через listUsers`);
            const { data: retryUsers, error: retryError } = await supabase.auth.admin.listUsers();
            if (retryError) {
              console.error(`[${new Date().toISOString()}] Ошибка при повторном поиске пользователей:`, retryError.message, retryError);
              return NextResponse.json({ success: false, error: 'Ошибка повторного поиска пользователей' }, { status: 500 });
            }
            const foundUser = retryUsers.users.find((u: any) => u.phone === phone);
            if (!foundUser) {
              console.error(`[${new Date().toISOString()}] Пользователь не найден даже после повторного поиска`);
              return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
            }
            userId = foundUser.id;
          } else {
            return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
          }
        } else {
          userId = newUser.user.id;
          console.log(`[${new Date().toISOString()}] Пользователь успешно создан: ${userId}`);
        }
      } else {
        userId = user.id;
        console.log(`[${new Date().toISOString()}] Пользователь найден: ${userId}`);
      }

      // Создаём сессию через signInWithOtp
      console.log(`[${new Date().toISOString()}] Создаём сессию для телефона: ${phone}`);
      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          shouldCreateUser: false, // Пользователь уже создан
        },
      });

      if (signInError) {
        console.error(`[${new Date().toISOString()}] Ошибка создания сессии через signInWithOtp:`, signInError.message, signInError);
        return NextResponse.json({ success: false, error: 'Ошибка создания сессии' }, { status: 500 });
      }

      // Получаем сессию
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error(`[${new Date().toISOString()}] Ошибка получения сессии:`, sessionError?.message, sessionError);
        return NextResponse.json({ success: false, error: 'Ошибка получения сессии' }, { status: 500 });
      }

      const accessToken = sessionData.session.access_token;
      console.log(`[${new Date().toISOString()}] Сессия успешно создана, access_token: ${accessToken}`);

      // Устанавливаем сессионный токен в куки
      const response = NextResponse.json({ success: true, status: 'VERIFIED', message: 'Авторизация завершена' });
      response.cookies.set('sb-access-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: '/',
        sameSite: 'strict',
      });

      console.log(`[${new Date().toISOString()}] Токен успешно установлен в куки: sb-access-token`);
      return response;
    }

    if (checkStatus === 402) {
      console.log(`[${new Date().toISOString()}] SMS.ru статус истёк (check_status: 402), обновляем auth_logs`);
      const { error: updateError } = await supabase
        .from('auth_logs')
        .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
        .eq('check_id', checkId);

      if (updateError) {
        console.error(`[${new Date().toISOString()}] Ошибка обновления auth_logs:`, updateError);
        return NextResponse.json({ success: false, error: 'Ошибка обновления статуса' }, { status: 500 });
      }

      return NextResponse.json({ success: true, status: 'EXPIRED', message: 'Срок действия истёк' });
    }

    console.log(`[${new Date().toISOString()}] SMS.ru статус остаётся PENDING (check_status: ${checkStatus})`);
    return NextResponse.json({ success: true, status: 'PENDING', message: 'Ожидание подтверждения' });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Ошибка в статусе:`, error.message, error.stack);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}