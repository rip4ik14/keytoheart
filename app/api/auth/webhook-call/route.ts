import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: true, persistSession: false },
  }
);

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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fields = Object.fromEntries(
      [...formData.entries()].map(([k, v]) => [k.toLowerCase(), v.toString()])
    );

    const checkId = fields['check_id'] || fields['checkid'];
    const phone = fields['phone'];
    const status = fields['status'];

    console.log(`[Webhook] checkId=${checkId}, phone=${phone}, status=${status}`);

    if (!checkId || !phone || !status) {
      return NextResponse.json({ success: false, error: 'Отсутствуют обязательные параметры' }, { status: 400 });
    }

    const newStatus = status === '401' ? 'VERIFIED' : 'PENDING';

    const { error: logError } = await supabase
      .from('auth_logs')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('check_id', checkId);

    if (logError) {
      console.error(`[Webhook] Ошибка обновления auth_logs:`, logError);
      return NextResponse.json({ success: false, error: 'Ошибка обновления статуса' }, { status: 500 });
    }

    if (newStatus !== 'VERIFIED') {
      return NextResponse.json({ success: true, message: 'Статус обновлён, ожидание подтверждения' });
    }

    // Ищем пользователя
    console.log(`[Webhook] Проверка пользователя в Supabase`);
    let user = await findUserByPhone(phone);
    let userId: string | undefined;

    if (!user) {
      console.log(`[Webhook] Пользователь не найден, создаём`);
      const email = `${phone.replace(/\D/g, '')}-${Date.now()}@temp.example.com`;

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone: phone,
        phone_confirm: true,
        email,
        email_confirm: true,
        user_metadata: { phone },
      });

      if (createError) {
        if (createError.message.includes('already registered')) {
          console.log(`[Webhook] Уже зарегистрирован — ищем повторно`);
          user = await findUserByPhone(phone);
          if (!user) {
            return NextResponse.json({ success: false, error: 'Пользователь уже есть, но не найден повторно' }, { status: 500 });
          }
        } else {
          console.error(`[Webhook] Ошибка создания:`, createError.message);
          return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
        }
      } else {
        user = newUser.user;
      }
    }

    userId = user?.id;
    console.log(`[Webhook] Пользователь: ${userId}`);

    // Проверим наличие профиля
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (!profile && (!profileError || profileError.code === 'PGRST116')) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([{ phone, updated_at: new Date().toISOString() }]);
      if (insertError) {
        console.error(`[Webhook] Ошибка вставки user_profiles:`, insertError.message);
        return NextResponse.json({ success: false, error: 'Ошибка создания профиля' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Пользователь подтверждён и обработан' });
  } catch (e: any) {
    console.error(`[Webhook] Ошибка сервера:`, e.message);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
