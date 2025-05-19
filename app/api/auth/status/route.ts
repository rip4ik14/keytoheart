import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

// Парсинг cookies из заголовка
function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  const pairs = header.split(';');
  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(part => part.trim());
    if (key && value) {
      cookies[key] = value;
    }
  }
  return cookies;
}

// Поиск пользователя REST-методом
async function findUserByPhone(phone: string) {
  const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
  const phoneWithoutPlus = phone.startsWith('+') ? phone.slice(1) : phone;

  const res = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/admin/users`,
    {
      headers: {
        apiKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  );
  const json = await res.json();
  console.log(`[${new Date().toISOString()}] findUserByPhone response for phone ${phone}:`, json);

  const user = json.users?.find((u: any) => u.phone === phoneWithPlus || u.phone === phoneWithoutPlus);
  return user ?? null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkId = searchParams.get('checkId');
  const phone = searchParams.get('phone');

  console.log(`[${new Date().toISOString()}] Проверка статуса для checkId: ${checkId}, телефон: ${phone}`);
  console.log(`[${new Date().toISOString()}] SUPABASE_URL: ${process.env.SUPABASE_URL}`);
  console.log(`[${new Date().toISOString()}] SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY}`);
  console.log(`[${new Date().toISOString()}] SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY}`);

  try {
    if (!checkId || !phone) {
      console.error(`[${new Date().toISOString()}] Отсутствуют обязательные параметры: checkId=${checkId}, phone=${phone}`);
      return NextResponse.json(
        { success: false, error: 'Не указаны обязательные параметры' },
        { status: 400 }
      );
    }

    // Проверяем переменные окружения во время выполнения
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(`[${new Date().toISOString()}] Missing required Supabase environment variables`);
      throw new Error('Missing required Supabase environment variables');
    }

    // Инициализация admin-клиента
    const supabaseAdmin = createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: true, persistSession: false } }
    );

    // Проверяем статус в auth_logs
    console.log(`[${new Date().toISOString()}] Запрос в auth_logs для checkId: ${checkId}`);
    const { data: authLog, error: logError } = await supabaseAdmin
      .from('auth_logs')
      .select('status')
      .eq('check_id', checkId)
      .single();

    if (logError || !authLog) {
      console.error(`[${new Date().toISOString()}] Ошибка получения записи из auth_logs:`, logError);
      return NextResponse.json({ success: false, error: 'checkId не найден' }, { status: 404 });
    }

    console.log(`[${new Date().toISOString()}] Статус из базы данных: ${authLog.status}`);

    // Проверяем наличие токенов в cookies через заголовок Cookie
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const accessToken = cookies['access_token'];
    const refreshToken = cookies['refresh_token'];

    if (authLog.status === 'VERIFIED' && accessToken && refreshToken) {
      console.log(`[${new Date().toISOString()}] Статус уже VERIFIED, токены найдены, возвращаем сразу`);
      return NextResponse.json({
        success: true,
        status: 'VERIFIED',
        message: 'Авторизация завершена',
        phone,
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    if (authLog.status === 'EXPIRED') {
      console.log(`[${new Date().toISOString()}] Статус EXPIRED, возвращаем сразу`);
      return NextResponse.json({ success: true, status: 'EXPIRED', message: 'Срок действия истёк' });
    }

    // Проверяем статус через SMS.ru API
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] Запрос к SMS.ru API: https://sms.ru/callcheck/status?api_id=${process.env.SMS_RU_API_ID}&check_id=${checkId}&json=1`);
    const smsRes = await fetch(
      `https://sms.ru/callcheck/status?api_id=${process.env.SMS_RU_API_ID}&check_id=${checkId}&json=1`,
      { cache: 'no-store' }
    );
    const sms = await smsRes.json();
    console.log(`[${new Date().toISOString()}] Ответ SMS.ru API (длительность: ${Date.now() - start}ms):`, sms);

    if (sms.status !== 'OK') {
      console.error(`[${new Date().toISOString()}] Ошибка SMS.ru API:`, sms?.status_text || 'Unknown error');
      return NextResponse.json({ success: false, error: 'Ошибка SMS.ru' }, { status: 502 });
    }

    const checkStatus = sms.check_status; // 400 | 401 | 402
    const newStatus = checkStatus === 401 ? 'VERIFIED' : checkStatus === 402 ? 'EXPIRED' : 'PENDING';

    console.log(`[${new Date().toISOString()}] Обновляем статус в auth_logs: ${newStatus}`);
    const { error: updateError } = await supabaseAdmin
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

    // Пользователь: найти или создать
    console.log(`[${new Date().toISOString()}] Проверка существования пользователя с телефоном: ${phone}`);
    let user = await findUserByPhone(phone);
    if (!user) {
      console.log(`[${new Date().toISOString()}] Пользователь с телефоном ${phone} не найден, регистрируем нового`);
      const email = `${phone.replace(/\D/g, '')}-${Date.now()}@temp.example.com`;
      const { data: nu, error } = await supabaseAdmin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        email,
        email_confirm: true,
        user_metadata: { phone },
      });
      if (error) {
        console.error(`[${new Date().toISOString()}] Ошибка создания пользователя:`, error.message);
        if (!error.message?.includes('already registered')) {
          return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
        }
        user = await findUserByPhone(phone); // Уже есть - нашли
      } else {
        user = nu.user;
      }
    }

    console.log(`[${new Date().toISOString()}] Пользователь найден или создан: ${user.id}`);

    // Профиль client-таблицы
    console.log(`[${new Date().toISOString()}] Проверка наличия профиля в user_profiles`);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`[${new Date().toISOString()}] Ошибка проверки профиля:`, profileError);
      return NextResponse.json({ success: false, error: 'Ошибка проверки профиля' }, { status: 500 });
    }

    if (!profile) {
      console.log(`[${new Date().toISOString()}] Профиль не найден, создаём новый`);
      const { error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert([{ phone, updated_at: new Date().toISOString() }]);
      if (insertError) {
        console.error(`[${new Date().toISOString()}] Ошибка создания профиля:`, insertError);
        return NextResponse.json({ success: false, error: 'Ошибка создания профиля' }, { status: 500 });
      }
    }

    // Генерация сессии через signInWithOtp
    console.log(`[${new Date().toISOString()}] Генерация OTP для пользователя: ${user.id}`);
    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      console.error(`[${new Date().toISOString()}] Ошибка генерации OTP:`, otpError.message);
      return NextResponse.json({ success: false, error: 'Ошибка генерации OTP' }, { status: 500 });
    }

    // Получение сессии
    const anonClient = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { data: sessionResult, error: sessionError } = await anonClient.auth.getSession();

    if (sessionError || !sessionResult.session) {
      console.error(`[${new Date().toISOString()}] Ошибка получения сессии:`, sessionError?.message);
      return NextResponse.json({ success: false, error: 'Ошибка создания сессии' }, { status: 500 });
    }

    const access_token = sessionResult.session.access_token;
    const refresh_token = sessionResult.session.refresh_token;

    // Отправка событий аналитики
    console.log(`[${new Date().toISOString()}] Sending analytics events: auth_success`);
    // Эти заголовки обрабатываются клиентским кодом
    const res = NextResponse.json({
      success: true,
      status: 'VERIFIED',
      message: 'Авторизация завершена',
      phone,
      access_token,
      refresh_token,
    });

    res.headers.set('X-GA-Event', JSON.stringify({ event: 'auth_success', phone }));
    res.headers.set('X-YM-Event', JSON.stringify({ event: 'auth_success', phone }));

    // Установка токенов в cookies
    const cfg = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/' };
    res.cookies.set('access_token', access_token, { ...cfg, expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) });
    res.cookies.set('refresh_token', refresh_token, { ...cfg, expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) });

    return res;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Ошибка в статусе:`, error.message, error.stack);
    return NextResponse.json({ success: false, error: 'Ошибка сервера: ' + error.message }, { status: 500 });
  }
}