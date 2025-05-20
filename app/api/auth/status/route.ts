import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkId = searchParams.get('checkId');
    const phone = searchParams.get('phone');

    if (!checkId || !phone) {
      console.error(`[${new Date().toISOString()}] Отсутствуют обязательные параметры: checkId=${checkId}, phone=${phone}`);
      return NextResponse.json(
        { success: false, error: 'Не указаны обязательные параметры' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
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

    // Проверяем статус через SMS.ru API
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] Запрос к SMS.ru API: https://sms.ru/callcheck/status?api_id=...&check_id=${checkId}&json=1`);
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
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) {
      console.error(`[${new Date().toISOString()}] Ошибка получения пользователей:`, userError);
      return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
    }

    const user = users.users.find((u) => u.phone === phone);
    let userId = user?.id;

    if (!user) {
      console.log(`[${new Date().toISOString()}] Пользователь с телефоном ${phone} не найден, регистрируем нового`);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        email: `${phone}-${Date.now()}@temp.example.com`,
        email_confirm: true,
      });
      if (createError || !newUser?.user) {
        console.error(`[${new Date().toISOString()}] Ошибка создания пользователя:`, createError?.message);
        return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
      }
      userId = newUser.user.id;
    }

    console.log(`[${new Date().toISOString()}] Пользователь найден или создан: ${userId}`);

    // Проверяем профиль
    console.log(`[${new Date().toISOString()}] Проверка наличия профиля в user_profiles`);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`[${new Date().toISOString()}] Ошибка проверки профиля:`, profileError);
      return NextResponse.json({ success: false, error: 'Error checking profile' }, { status: 500 });
    }

    if (!profile) {
      console.log(`[${new Date().toISOString()}] Профиль не найден, создаём новый`);
      const { error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert([{ id: userId, phone }]);
      if (insertError) {
        console.error(`[${new Date().toISOString()}] Ошибка создания профиля:`, insertError);
        return NextResponse.json({ success: false, error: 'Error creating profile' }, { status: 500 });
      }
    }

    // Создаём сессию
    console.log(`[${new Date().toISOString()}] Создание сессии для пользователя: ${userId}`);
    const { data: session, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${phone}-${Date.now()}@temp.example.com`,
      options: { redirectTo: `${new URL(req.url).origin}/cart` },
    });

    if (sessionError || !session?.properties?.action_link) {
      console.error(`[${new Date().toISOString()}] Ошибка создания сессии:`, sessionError?.message);
      return NextResponse.json({ success: false, error: 'Failed to generate session' }, { status: 500 });
    }

    const access_token = session.properties.action_link.split('token=')[1].split('&')[0];
    const refresh_token = session.properties.action_link.split('refresh_token=')[1].split('&')[0];

    const response = NextResponse.json({
      success: true,
      status: 'VERIFIED',
      message: 'Авторизация завершена',
      phone,
      access_token,
      refresh_token,
    });

    // Устанавливаем cookie
    response.headers.set(
      'Set-Cookie',
      `sb-gwbeabfkknhewwoesqax-auth-token=${JSON.stringify({ access_token, refresh_token })}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    );

    console.log(`[${new Date().toISOString()}] Cookies set: sb-gwbeabfkknhewwoesqax-auth-token`);
    return response;
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Ошибка в статусе:`, error.message);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}