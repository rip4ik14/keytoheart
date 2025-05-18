import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: true, persistSession: false } }
);

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;

async function findUserByPhone(phone: string) {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(`[${new Date().toISOString()}] Ошибка при получении списка пользователей:`, error.message);
    throw new Error('Ошибка получения списка пользователей');
  }
  return users.users.find((u: any) => u.phone === phone) || null;
}

async function generateTokens(userId: string) {
  // Используем REST API Supabase для генерации токенов
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=passwordless`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
    body: JSON.stringify({
      user_id: userId,
      phone: true, // Указываем, что это токен для phone-based аутентификации
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token || !data.refresh_token) {
    console.error(`[${new Date().toISOString()}] Ошибка генерации токенов через REST API:`, data);
    throw new Error('Ошибка генерации токенов');
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}

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
      return NextResponse.json({ success: true, status: 'VERIFIED', message: 'Авторизация завершена', phone });
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

    let smsData: any;
    try {
      smsData = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error(`[${new Date().toISOString()}] Ошибка парсинга ответа SMS.ru:`, parseError.message);
      return NextResponse.json({ success: false, error: 'Ошибка ответа от SMS.ru' }, { status: 500 });
    }

    if (!res.ok || smsData.status !== 'OK') {
      console.error(`[${new Date().toISOString()}] Ошибка SMS.ru API:`, smsData?.status_text || 'Unknown error');
      return NextResponse.json({ success: false, error: 'Ошибка проверки статуса' }, { status: 500 });
    }

    const checkStatus = smsData.check_status;
    const newStatus = checkStatus === 401 ? 'VERIFIED' : checkStatus === 402 ? 'EXPIRED' : 'PENDING';

    console.log(`[${new Date().toISOString()}] Обновляем статус в auth_logs: ${newStatus}`);
    const { error: updateError } = await supabase
      .from('auth_logs')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('check_id', checkId);

    if (updateError) {
      console.error(`[${new Date().toISOString()}] Ошибка обновления auth_logs:`, updateError);
      return NextResponse.json({ success: false, error: 'Ошибка обновления статуса' }, { status: 500 });
    }

    if (newStatus !== 'VERIFIED') {
      console.log(`[${new Date().toISOString()}] Статус ${newStatus}, возвращаем ответ`);
      return NextResponse.json({ success: true, status: newStatus, phone });
    }

    // Найти или создать пользователя
    console.log(`[${new Date().toISOString()}] Проверка существования пользователя с телефоном: ${phone}`);
    let user = await findUserByPhone(phone);
    const email = `${phone.replace(/\D/g, '')}-${Date.now()}@temp.example.com`;

    if (!user) {
      console.log(`[${new Date().toISOString()}] Пользователь не найден, создаём нового для телефона: ${phone}`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone,
        phone_confirm: true,
        email,
        email_confirm: true,
        user_metadata: { phone },
      });

      if (createError) {
        console.error(`[${new Date().toISOString()}] Ошибка создания пользователя:`, createError.message);
        if (createError.message.includes('already registered')) {
          console.log(`[${new Date().toISOString()}] Пользователь уже зарегистрирован, повторный поиск через findUserByPhone`);
          user = await findUserByPhone(phone);
          if (!user) {
            console.error(`[${new Date().toISOString()}] Пользователь не найден даже после повторного поиска`);
            return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
          }
        } else {
          return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
        }
      } else {
        user = newUser.user;
      }
    }

    console.log(`[${new Date().toISOString()}] Пользователь найден или создан: ${user.id}`);

    // Создание профиля
    console.log(`[${new Date().toISOString()}] Проверка наличия профиля в user_profiles`);
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (!profile && (!profileError || profileError.code === 'PGRST116')) {
      console.log(`[${new Date().toISOString()}] Профиль не найден, создаём новый`);
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([{ phone, updated_at: new Date().toISOString() }]);
      if (insertError) {
        console.error(`[${new Date().toISOString()}] Ошибка создания профиля:`, insertError);
        return NextResponse.json({ success: false, error: 'Ошибка создания профиля' }, { status: 500 });
      }
    }

    // Генерация токенов через REST API
    console.log(`[${new Date().toISOString()}] Генерация токенов для пользователя: ${user.id}`);
    const { access_token, refresh_token } = await generateTokens(user.id);

    // Устанавливаем cookies
    const response = NextResponse.json({
      success: true,
      status: 'VERIFIED',
      message: 'Авторизация завершена',
      phone,
      access_token,
      refresh_token,
    });

    const accessExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3); // 3 дня
    const refreshExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 дней

    response.cookies.set('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: accessExpires,
      path: '/',
    });

    response.cookies.set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: refreshExpires,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Ошибка в статусе:`, error.message, error.stack);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}