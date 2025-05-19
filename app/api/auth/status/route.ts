import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkId = searchParams.get('checkId');
    const phone = searchParams.get('phone');

    if (!checkId || !phone) {
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
    const { data: authLog, error: logError } = await supabaseAdmin
      .from('auth_logs')
      .select('status')
      .eq('check_id', checkId)
      .eq('phone', phone)
      .single();

    if (logError || !authLog) {
      return NextResponse.json({ success: false, error: 'checkId не найден' }, { status: 404 });
    }

    // Проверяем статус через SMS.ru API
    const smsRes = await fetch(
      `https://sms.ru/callcheck/status?api_id=${process.env.SMS_RU_API_ID}&check_id=${checkId}&json=1`,
      { cache: 'no-store' }
    );
    const sms = await smsRes.json();

    if (sms.status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Ошибка SMS.ru' }, { status: 502 });
    }

    const checkStatus = sms.check_status; // 400 | 401 | 402
    const newStatus = checkStatus === 401 ? 'VERIFIED' : checkStatus === 402 ? 'EXPIRED' : 'PENDING';

    const { error: updateError } = await supabaseAdmin
      .from('auth_logs')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('check_id', checkId);

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Ошибка обновления статуса' }, { status: 500 });
    }

    if (newStatus !== 'VERIFIED') {
      return NextResponse.json({ success: true, status: newStatus, phone });
    }

    // Пользователь: найти или создать
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) {
      return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
    }

    const user = users.users.find((u) => u.phone === phone);
    let userId = user?.id;

    if (!user) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        email: `${phone}-${Date.now()}@temp.example.com`,
        email_confirm: true,
      });
      if (createError || !newUser?.user) {
        return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
      }
      userId = newUser.user.id;
    }

    // Проверяем профиль
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json({ success: false, error: 'Error checking profile' }, { status: 500 });
    }

    if (!profile) {
      await supabaseAdmin.from('user_profiles').insert({ id: userId, phone });
    }

    // Создаём сессию
    const { data: session, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${phone}-${Date.now()}@temp.example.com`,
      options: { redirectTo: `${new URL(req.url).origin}/cart` },
    });

    if (sessionError || !session?.properties?.action_link) {
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

    // Устанавливаем cookie с правильным именем
    response.headers.set(
      'Set-Cookie',
      `sb-gwbeabfkknhewwoesqax-auth-token=${JSON.stringify({ access_token, refresh_token })}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}