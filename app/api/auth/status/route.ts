import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

// ──────────────────────────────────────
// 1. инициализация admin-клиента
// ──────────────────────────────────────
const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // service-role
  { auth: { autoRefreshToken: true, persistSession: false } }
);

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;

// ──────────────────────────────────────
// 2. поиск пользователя REST-методом
// ──────────────────────────────────────
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
  return json.users?.[0] ?? null;
}

// ──────────────────────────────────────
// 3. основной обработчик
// ──────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkId = searchParams.get('checkId');
  const phone   = searchParams.get('phone');

  if (!checkId || !phone) {
    return NextResponse.json(
      { success: false, error: 'Не указаны обязательные параметры' },
      { status: 400 }
    );
  }

  // ── 3.1 cмотрим локальный auth_logs
  const { data: authLog } = await supabaseAdmin
    .from('auth_logs')
    .select('status')
    .eq('check_id', checkId)
    .single();

  if (!authLog) {
    return NextResponse.json({ success: false, error: 'checkId не найден' }, { status: 404 });
  }
  if (authLog.status === 'VERIFIED') {
    return NextResponse.json({ success: true, status: 'VERIFIED', phone });
  }

  // ── 3.2 спрашиваем SMS.ru
  const smsRes = await fetch(
    `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`,
    { cache: 'no-store' }
  );
  const sms = await smsRes.json();

  if (sms.status !== 'OK') {
    return NextResponse.json({ success: false, error: 'Ошибка SMS.ru' }, { status: 502 });
  }

  const checkStatus = sms.check_status;                 // 400 | 401 | 402
  const newStatus   = checkStatus === 401 ? 'VERIFIED'
                   : checkStatus === 402 ? 'EXPIRED'
                   : 'PENDING';

  await supabaseAdmin
    .from('auth_logs')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('check_id', checkId);

  if (newStatus !== 'VERIFIED') {
    return NextResponse.json({ success: true, status: newStatus, phone });
  }

  // ──────────────────────────────────
  // 4. пользователь: найти или создать
  // ──────────────────────────────────
  let user = await findUserByPhone(phone);

  if (!user) {
    const email = `${phone.replace(/\D/g, '')}-${Date.now()}@temp.example.com`;
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      phone,
      phone_confirm: true,
      email,
      email_confirm: true,
      user_metadata: { phone },
    });
    if (error) {
      if (!error.message?.includes('already registered')) {
        return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
      }
      user = await findUserByPhone(phone);   // уже есть - нашли
    } else {
      user = created.user;
    }
  }

  // ──────────────────────────────────
  // 5. профиль client-таблицы
  // ──────────────────────────────────
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('phone', phone)
    .single();

  if (!profile) {
    await supabaseAdmin
      .from('user_profiles')
      .insert([{ phone, updated_at: new Date().toISOString() }]);
  }

  // ──────────────────────────────────
  // 6. magick-link → setSession → токены
  // ──────────────────────────────────
  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email!,
    options: { redirectTo: 'https://keytoheart.ru' },
  });
  if (linkErr) {
    return NextResponse.json({ success: false, error: 'generateLink error' }, { status: 500 });
  }

  const actionLink = linkData.properties?.action_link as string;
  const magicToken = new URL(actionLink).searchParams.get('token');

  if (!magicToken) {
    return NextResponse.json({ success: false, error: 'token not found' }, { status: 500 });
  }

  // создаём сессию:
  const anonClient = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!      // anon-key, сессия запишется в jwt
  );

  const { data: sess, error: sessErr } = await anonClient.auth.setSession({
    access_token: magicToken,
    refresh_token: '',
  });

  if (sessErr || !sess.session) {
    return NextResponse.json({ success: false, error: 'setSession error' }, { status: 500 });
  }

  const accessToken  = sess.session.access_token;
  const refreshToken = sess.session.refresh_token;

  // ──────────────────────────────────
  // 7. кладём токены в HttpOnly-cookie
  // ──────────────────────────────────
  const res = NextResponse.json({
    success: true,
    status: 'VERIFIED',
    message: 'Авторизация завершена',
    phone,
  });

  const cookieCfg = {
    httpOnly: true,
    secure:   true,
    sameSite: 'strict' as const,
    path: '/',
  };
  res.cookies.set('access_token',  accessToken,  { ...cookieCfg, expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)  }); // 3 дня
  res.cookies.set('refresh_token', refreshToken, { ...cookieCfg, expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) }); // 30 дней

  return res;
}
