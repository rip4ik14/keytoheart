import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: true, persistSession: false } }
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
    console.log(`[${new Date().toISOString()}] Webhook request received:`, {
      headers: Object.fromEntries(request.headers.entries()),
      method: request.method,
    });

    // Парсим multipart/form-data
    const formData = await request.formData();
    const formDataEntries = Object.fromEntries(formData.entries());
    console.log(`[${new Date().toISOString()}] Webhook form-data:`, formDataEntries);

    // Извлекаем все элементы data[]
    const dataEntries = Object.keys(formDataEntries)
      .filter((key) => key.startsWith('data['))
      .map((key) => formDataEntries[key]);

    // Парсим каждую строку из data[]
    for (const entry of dataEntries) {
      // Проверяем, что entry — это строка
      if (typeof entry !== 'string') {
        console.error(`[${new Date().toISOString()}] Webhook запись не является строкой:`, entry);
        continue;
      }

      const lines = entry.split('\n');
      if (lines[0] !== 'callcheck_status') continue; // Пропускаем записи, не связанные с callcheck_status

      const checkId = lines[1]; // check_id
      const status = lines[2]; // status (например, 401 или 402)
      const timestamp = lines[3]; // timestamp

      console.log(`[${new Date().toISOString()}] Обработка webhook: checkId=${checkId}, status=${status}, timestamp=${timestamp}`);

      if (!checkId || !status) {
        console.error(`[${new Date().toISOString()}] Отсутствуют обязательные параметры в записи: checkId=${checkId}, status=${status}`);
        continue;
      }

      // Находим phone в auth_logs по checkId
      const { data: authLog, error: logError } = await supabase
        .from('auth_logs')
        .select('phone')
        .eq('check_id', checkId)
        .single();

      if (logError || !authLog) {
        console.error(`[${new Date().toISOString()}] Ошибка получения записи из auth_logs для checkId=${checkId}:`, logError);
        continue;
      }

      const phone = authLog.phone;
      console.log(`[${new Date().toISOString()}] Найден phone для checkId=${checkId}: ${phone}`);

      const newStatus = status === '401' ? 'VERIFIED' : status === '402' ? 'EXPIRED' : 'PENDING';

      // Обновляем статус в auth_logs
      const { error: updateError } = await supabase
        .from('auth_logs')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('check_id', checkId);

      if (updateError) {
        console.error(`[${new Date().toISOString()}] Ошибка обновления auth_logs:`, updateError);
        continue;
      }

      if (newStatus !== 'VERIFIED') {
        console.log(`[${new Date().toISOString()}] Статус не VERIFIED, пропускаем создание профиля`);
        continue;
      }

      // Проверяем или создаём профиль в user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('phone', phone)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error(`[${new Date().toISOString()}] Ошибка проверки профиля:`, profileError);
        continue;
      }

      if (!profile) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([{ phone, updated_at: new Date().toISOString() }]);
        if (insertError) {
          console.error(`[${new Date().toISOString()}] Ошибка создания профиля:`, insertError);
          continue;
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook обработан' });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Ошибка в webhook-call:`, error.message, error.stack);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}