// app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import type { Database } from '@/lib/supabase/types_new';

// утилита для парсинга куки
function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const [k, v] = part.split('=').map(s => s.trim());
    if (k && v) cookies[k] = v;
  }
  return cookies;
}

async function findUserByPhone(phone: string) {
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apiKey: adminKey,
      Authorization: `Bearer ${adminKey}`,
    },
  });
  const json = await res.json();
  return json.users?.find((u: any) =>
    u.phone === `+${phone}` || u.phone === phone
  ) ?? null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkId = searchParams.get('checkId');
  const phone = searchParams.get('phone')?.replace(/^\+/, '')!;

  if (!checkId || !phone) {
    return NextResponse.json({ success: false, error: 'Недостаточно параметров' }, { status: 400 });
  }

  try {
    // 1) Читаем статус звонка из Prisma (таблица public.auth_logs)
    const log = await prisma.auth_logs.findUnique({
      where: { check_id: checkId },
      select: { status: true },
    });
    if (!log) {
      return NextResponse.json({ success: false, error: 'checkId не найден' }, { status: 404 });
    }
    if (log.status === 'VERIFIED' || log.status === 'EXPIRED') {
      // проверяем, лежат ли у нас токены в куки
      const cookies = parseCookies(req.headers.get('cookie'));
      if (log.status === 'VERIFIED' && cookies['sb-access-token'] && cookies['sb-refresh-token']) {
        return NextResponse.json({
          success: true,
          status: 'VERIFIED',
          access_token: cookies['sb-access-token'],
          refresh_token: cookies['sb-refresh-token'],
        });
      }
      return NextResponse.json({ success: true, status: log.status });
    }

    // 2) Иначе запрашиваем статус у SMS.ru
    const smsRes = await fetch(
      `https://sms.ru/callcheck/status?api_id=${process.env.SMS_RU_API_ID}&check_id=${checkId}&json=1`
    );
    const smsJson = await smsRes.json();
    if (smsJson.status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Ошибка SMS.ru' }, { status: 502 });
    }

    // 3) Маппинг к нашему статусу
    let newStatus: 'PENDING' | 'VERIFIED' | 'EXPIRED' = 'PENDING';
    if (smsJson.check_status === 401) newStatus = 'VERIFIED';
    if (smsJson.check_status === 402) newStatus = 'EXPIRED';

    // 4) Обновляем в Prisma
    await prisma.auth_logs.update({
      where: { check_id: checkId },
      data: { status: newStatus, updated_at: new Date() },
    });

    if (newStatus !== 'VERIFIED') {
      return NextResponse.json({ success: true, status: newStatus });
    }

    // 5) При VERIFIED — находим или создаём пользователя
    let user = await findUserByPhone(phone);
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient<Database>(process.env.SUPABASE_URL!, adminKey);

    let emailPlaceholder = `${phone}-${Date.now()}@temp.local`;
    const tempPwd = 'TempPassword123!';
    if (!user) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        phone: `+${phone}`,
        phone_confirm: true,
        email: emailPlaceholder,
        email_confirm: true,
        password: tempPwd,
        user_metadata: { phone },
      });
      if (createErr) throw createErr;
      user = created.user;
    } else {
      emailPlaceholder = user.email!;
      await supabaseAdmin.auth.admin.updateUserById(user.id, { password: tempPwd });
    }

    // 6) Убеждаемся, что есть профиль в Prisma public.user_profiles
    const exists = await prisma.user_profiles.findUnique({ where: { phone } });
    if (!exists) {
      await prisma.user_profiles.create({ data: { phone, id: user.id, created_at: new Date() } });
    }

    // 7) Создаём сессию через anonClient
    const anon = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { data: sessData, error: signInErr } = await anon.auth.signInWithPassword({
      email: emailPlaceholder,
      password: tempPwd,
    });
    if (signInErr || !sessData.session) throw signInErr ?? new Error('Не удалось войти');

    const { access_token, refresh_token } = sessData.session;
    const res = NextResponse.json({
      success: true,
      status: 'VERIFIED',
      access_token,
      refresh_token,
    });
    // кладём их в куки
    const cookieOpts = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/' };
    res.cookies.set('sb-access-token', access_token, { ...cookieOpts, maxAge: 3 * 24 * 3600 });
    res.cookies.set('sb-refresh-token', refresh_token, { ...cookieOpts, maxAge: 30 * 24 * 3600 });
    return res;
  } catch (e: any) {
    console.error('status/route.ts миддлвар ошибка:', e);
    return NextResponse.json({ success: false, error: e.message || 'Серверная ошибка' }, { status: 500 });
  }
}
