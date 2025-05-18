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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkId = searchParams.get('checkId');
  const phone = searchParams.get('phone');

  if (!checkId || !phone) {
    return NextResponse.json({ success: false, error: 'Не указаны обязательные параметры' }, { status: 400 });
  }

  const { data: authLog, error: logError } = await supabase
    .from('auth_logs')
    .select('status')
    .eq('check_id', checkId)
    .single();

  if (logError || !authLog) {
    return NextResponse.json({ success: false, error: 'Запись не найдена' }, { status: 404 });
  }

  const statusInDb = authLog.status;

  if (statusInDb === 'VERIFIED') {
    return NextResponse.json({ success: true, status: 'VERIFIED', phone });
  }

  const smsRes = await fetch(
    `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`,
    { cache: 'no-store' }
  );

  const text = await smsRes.text();
  let smsData: any;

  try {
    smsData = JSON.parse(text);
  } catch {
    return NextResponse.json({ success: false, error: 'Ошибка парсинга SMS.ru' }, { status: 500 });
  }

  if (smsData.status !== 'OK') {
    return NextResponse.json({ success: false, error: 'Ошибка SMS.ru' }, { status: 500 });
  }

  const checkStatus = smsData.check_status;
  const newStatus = checkStatus === 401 ? 'VERIFIED' : checkStatus === 402 ? 'EXPIRED' : 'PENDING';

  await supabase
    .from('auth_logs')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('check_id', checkId);

  if (newStatus !== 'VERIFIED') {
    return NextResponse.json({ success: true, status: newStatus, phone });
  }

  // Найти или создать пользователя
  let user = await findUserByPhone(phone);
  const email = `${phone.replace(/\D/g, '')}-${Date.now()}@temp.example.com`;

  if (!user) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      phone,
      phone_confirm: true,
      email,
      email_confirm: true,
      user_metadata: { phone },
    });

    if (createError) {
      if (createError.message.includes('already registered')) {
        user = await findUserByPhone(phone);
      } else {
        return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
      }
    } else {
      user = newUser.user;
    }
  }

  // Создание профиля
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('phone', phone)
    .single();

  if (!profile && (!profileError || profileError.code === 'PGRST116')) {
    await supabase
      .from('user_profiles')
      .insert([{ phone, updated_at: new Date().toISOString() }]);
  }

  // Magic Link и токен
  const { data: sessionData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email || email,
    options: { redirectTo: 'https://keytoheart.ru' },
  });

  const magicLink = sessionData?.properties?.action_link;
  const token = magicLink?.split('token=')[1]?.split('&')[0];

  if (!token) {
    return NextResponse.json({ success: false, error: 'Не удалось извлечь токен' }, { status: 500 });
  }

  // Устанавливаем сессию
  const client = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authSession, error: sessionError } = await client.auth.setSession({
    access_token: token,
    refresh_token: '',
  });

  if (sessionError || !authSession.session) {
    return NextResponse.json({ success: false, error: 'Ошибка установки сессии' }, { status: 500 });
  }

  const accessToken = authSession.session.access_token;
  const refreshToken = authSession.session.refresh_token;

  // Устанавливаем cookies
  const response = NextResponse.json({
    success: true,
    status: 'VERIFIED',
    message: 'Авторизация завершена',
    phone,
  });

  const accessExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3); // 3 дня
  const refreshExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 дней

  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    expires: accessExpires,
    path: '/',
  });

  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    expires: refreshExpires,
    path: '/',
  });

  return response;
}
