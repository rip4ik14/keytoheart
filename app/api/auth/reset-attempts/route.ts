// ✅ Исправленный: app/api/auth/reset-attempts/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'Номер телефона обязателен' }, { status: 400 });
    }

    // Проверяем, существует ли запись
    const { data: existingAttempt, error: fetchError } = await supabase
      .from('auth_attempts')
      .select('phone')
      .eq('phone', phone)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching auth_attempts:', fetchError);
      return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
    }

    if (!existingAttempt) {
      // Если записи нет, создаём новую с attempt_count = 0
      const { error: insertError } = await supabase
        .from('auth_attempts')
        .insert({ phone, attempt_count: 0, last_attempt: new Date().toISOString() });

      if (insertError) {
        console.error('Error creating auth_attempts record:', insertError);
        return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
      }
    } else {
      // Если запись есть, обновляем attempt_count
      const { error: updateError } = await supabase
        .from('auth_attempts')
        .update({ attempt_count: 0, last_attempt: new Date().toISOString() })
        .eq('phone', phone);

      if (updateError) {
        console.error('Error resetting auth_attempts:', updateError);
        return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resetting attempts:', error);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}