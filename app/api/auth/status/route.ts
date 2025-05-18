import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';          // ✅ из next/headers
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

// ─── 1. Инициализируем Supabase Admin клиент ────────────────
const sb = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;

// ─── 2. Хелпер: поиск пользователя по телефону (+7 / 7) ──────
async function findUser(phone: string) {
  const plus = phone.startsWith('+') ? phone : `+${phone}`;
  const raw  = phone.startsWith('+') ? phone.slice(1) : phone;

  const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error('listUsers: ' + error.message);

  return data.users.find(u => u.phone === plus || u.phone === raw) ?? null;
}

// ─── 3. Хелпер: выдача сессии через magic-link + setSession ─
async function issueSession(email: string) {
  const { data, error } = await sb.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: 'https://keytoheart.ru' },
  });
  if (error) throw new Error('generateLink: ' + error.message);

  const token = new URL(data.properties!.action_link as string)
    .searchParams.get('token');
  if (!token) throw new Error('token not found');

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

// ─── 4. Основной API-хендлер ────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkId = searchParams.get('checkId');
  const phone   = searchParams.get('phone');

  if (!checkId || !phone) {
    return NextResponse.json(
      { success: false, error: 'checkId и phone обязательны' },
      { status: 400 }
    );
  }

  // 4.1 Получаем текущий статус из auth_logs
  const { data: log } = await sb
    .from('auth_logs')
    .select('status')
    .eq('check_id', checkId)
    .single();

  if (!log) {
    return NextResponse.json(
      { success: false, error: 'checkId не найден' },
      { status: 404 }
    );
  }

  // 4.2 Читаем куки (await!)
  const cookieStore = await cookies();
  const hasToken    = cookieStore.get('access_token')?.value;

  // Если уже VERIFIED и кука есть — сразу ответ
  if (log.status === 'VERIFIED' && hasToken) {
    return NextResponse.json({ success: true, status: 'VERIFIED', phone });
  }

  // 4.3 Спрашиваем SMS.ru
  const sms = await fetch(
    `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`,
    { cache: 'no-store' }
  ).then(r => r.json());

  if (sms.status !== 'OK') {
    return NextResponse.json(
      { success: false, error: 'Ошибка SMS.ru' },
      { status: 502 }
    );
  }

  const st        = sms.check_status;            // 400|401|402
  const newStatus = st === 401 ? 'VERIFIED'
                 : st === 402 ? 'EXPIRED'
                 : 'PENDING';

  await sb
    .from('auth_logs')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('check_id', checkId);

  if (newStatus !== 'VERIFIED') {
    return NextResponse.json({ success: true, status: newStatus, phone });
  }

  // 4.4 Находим или создаём пользователя
  let user = await findUser(phone);
  if (!user) {
    const email = `${phone.replace(/\D/g, '')}-${Date.now()}@temp.example.com`;
    const { data, error } = await sb.auth.admin.createUser({
      phone, phone_confirm: true,
      email, email_confirm: true,
      user_metadata: { phone },
    });
    if (error && !error.message.includes('already registered')) {
      return NextResponse.json(
        { success: false, error: 'createUser: ' + error.message },
        { status: 500 }
      );
    }
    user = data?.user ?? await findUser(phone);
  }

  // 4.5 Убеждаемся, что есть профиль
  const { data: prof } = await sb
    .from('user_profiles')
    .select('id')
    .eq('phone', phone)
    .single();

  if (!prof) {
    await sb
      .from('user_profiles')
      .insert([{ phone, updated_at: new Date().toISOString() }]);
  }

  // 4.6 Генерируем новую сессию и токены
  let tokens;
  try {
    tokens = await issueSession(user!.email!);
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }

  // 4.7 Устанавливаем куки и возвращаем JSON
  const res = NextResponse.json({
    success: true,
    status: 'VERIFIED',
    phone,
    access_token:  tokens.access,
    refresh_token: tokens.refresh,
  });

  const cfg = {
    httpOnly: true,
    secure:   true,
    sameSite: 'strict' as const,
    path:     '/',
  };
  res.cookies.set('access_token',  tokens.access,  { ...cfg, maxAge: 60 * 60 * 24 * 3  });
  res.cookies.set('refresh_token', tokens.refresh, { ...cfg, maxAge: 60 * 60 * 24 * 30 });

  return res;
}
