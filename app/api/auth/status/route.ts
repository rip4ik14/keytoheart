import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

// ─── admin-клиент ───────────────────────────────────────────
const sb = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;

// ─── helper: ищем +7 / 7 формат ────────────────────────────
async function findUser(phone: string) {
  const plus = phone.startsWith('+') ? phone : `+${phone}`;
  const raw  = phone.startsWith('+') ? phone.slice(1) : phone;

  const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error('listUsers: ' + error.message);

  return data.users.find(u => u.phone === plus || u.phone === raw) ?? null;
}

// ─── helper: создаём полноценную сессию через magic-link ──
async function issueSession(email: string) {
  const { data, error } = await sb.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: 'https://keytoheart.ru' },   // неважно, ссылку не откроем
  });
  if (error) throw new Error('generateLink: ' + error.message);

  const token = new URL(data.properties!.action_link as string)
    .searchParams.get('token');
  if (!token) throw new Error('token not found in magiclink');

  /* setSession принимает access-token и вернёт оба токена */
  const { data: s, error: e } = await sb.auth.setSession({
    access_token: token,
    refresh_token: '',
  });
  if (e || !s.session) throw new Error('setSession: ' + (e?.message ?? 'no session'));

  return {
    access:  s.session.access_token,
    refresh: s.session.refresh_token,
  };
}

// ─── основной энд-поинт ────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkId = searchParams.get('checkId');
  const phone   = searchParams.get('phone');

  if (!checkId || !phone)
    return NextResponse.json({ success: false, error: 'checkId и phone обязательны' }, { status: 400 });

  /* 1. auth_logs локально */
  const { data: log } = await sb
    .from('auth_logs')
    .select('status')
    .eq('check_id', checkId)
    .single();

  if (!log)
    return NextResponse.json({ success: false, error: 'checkId не найден' }, { status: 404 });

  if (log.status === 'VERIFIED')
    return NextResponse.json({ success: true, status: 'VERIFIED', phone });

  /* 2. спрашиваем SMS.ru */
  const sms = await fetch(
    `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`,
    { cache: 'no-store' }
  ).then(r => r.json());

  if (sms.status !== 'OK')
    return NextResponse.json({ success: false, error: 'Ошибка SMS.ru' }, { status: 502 });

  const st        = sms.check_status;            // 400|401|402
  const newStatus = st === 401 ? 'VERIFIED'
                 : st === 402 ? 'EXPIRED'
                 : 'PENDING';

  await sb.from('auth_logs')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('check_id', checkId);

  if (newStatus !== 'VERIFIED')
    return NextResponse.json({ success: true, status: newStatus, phone });

  /* 3. user create / fetch */
  let user = await findUser(phone);
  if (!user) {
    const email = `${phone.replace(/\D/g, '')}-${Date.now()}@temp.example.com`;
    const { data, error } = await sb.auth.admin.createUser({
      phone, phone_confirm: true,
      email, email_confirm: true,
      user_metadata: { phone },
    });
    if (error && !error.message.includes('already registered'))
      return NextResponse.json({ success: false, error: 'createUser: ' + error.message }, { status: 500 });
    user = data?.user ?? await findUser(phone);
  }

  /* 4. ensure profile */
  const { data: prof } = await sb
    .from('user_profiles')
    .select('id')
    .eq('phone', phone)
    .single();

  if (!prof)
    await sb.from('user_profiles').insert([{ phone, updated_at: new Date().toISOString() }]);

  /* 5. токены через magic-link */
  let tokens;
  try {
    tokens = await issueSession(user!.email!);
  } catch (e: any) {
    return NextResponse.json({ success:false, error:e.message }, { status:500 });
  }

  /* 6. cookies + JSON */
  const res = NextResponse.json({
    success: true,
    status: 'VERIFIED',
    phone,
    access_token:  tokens.access,
    refresh_token: tokens.refresh,
  });

  const cfg = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/' };
  res.cookies.set('access_token',  tokens.access,  { ...cfg, maxAge: 60*60*24*3  });
  res.cookies.set('refresh_token', tokens.refresh, { ...cfg, maxAge: 60*60*24*30 });

  return res;
}
