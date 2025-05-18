import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabaseAdmin = createClient<Database>(
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
  return json.users?.[0] ?? null;
}

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

  const sms = await fetch(
    `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`,
    { cache: 'no-store' }
  ).then(r => r.json());

  if (sms.status !== 'OK') {
    return NextResponse.json({ success: false, error: 'Ошибка SMS.ru' }, { status: 502 });
  }

  const st = sms.check_status;                         // 400|401|402
  const newStatus = st === 401 ? 'VERIFIED' : st === 402 ? 'EXPIRED' : 'PENDING';

  await supabaseAdmin
    .from('auth_logs')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('check_id', checkId);

  if (newStatus !== 'VERIFIED') {
    return NextResponse.json({ success: true, status: newStatus, phone });
  }

  /* ─── пользователь ─────────────────────────────── */
  let user = await findUserByPhone(phone);
  if (!user) {
    const email = `${phone.replace(/\D/g, '')}-${Date.now()}@temp.example.com`;
    const { data: nu, error } = await supabaseAdmin.auth.admin.createUser({
      phone, phone_confirm: true,
      email, email_confirm: true,
      user_metadata: { phone },
    });
    if (error && !error.message?.includes('already registered')) {
      return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
    }
    user = nu?.user ?? await findUserByPhone(phone);
  }

  /* ─── профиль ──────────────────────────────────── */
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('phone', phone)
    .single();

  if (!profile) {
    await supabaseAdmin.from('user_profiles').insert([{ phone, updated_at: new Date().toISOString() }]);
  }

  /* ─── magic-link → setSession ──────────────────── */
  const { data: link } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email!,
    options: { redirectTo: 'https://keytoheart.ru' },
  });

  const magicToken = new URL(link.properties!.action_link as string).searchParams.get('token');
  if (!magicToken) {
    return NextResponse.json({ success: false, error: 'token not found' }, { status: 500 });
  }

  const anon = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!            // ⚠️  обязательно добавить в .env
  );

  const { data: sess, error: sessErr } = await anon.auth.setSession({
    access_token: magicToken,
    refresh_token: '',
  });

  if (sessErr || !sess.session) {
    return NextResponse.json({ success: false, error: 'setSession error' }, { status: 500 });
  }

  const { access_token, refresh_token } = sess.session;

  /* ─── cookie + JSON ────────────────────────────── */
  const res = NextResponse.json({
    success: true,
    status: 'VERIFIED',
    phone,
    access_token,
    refresh_token,
  });

  const cfg = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/' };
  res.cookies.set('access_token',  access_token,  { ...cfg, expires: new Date(Date.now() + 1000*60*60*24*3 ) });
  res.cookies.set('refresh_token', refresh_token, { ...cfg, expires: new Date(Date.now() + 1000*60*60*24*30) });

  return res;
}
