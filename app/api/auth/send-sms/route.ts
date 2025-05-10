import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';
import sanitizeHtml from 'sanitize-html';

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    console.log('Получен запрос на отправку SMS:', { phone });

    // Проверка переменных окружения
    if (!supabaseUrl || !supabaseKey) {
      console.error('SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не заданы в .env', {
        supabaseUrl,
        supabaseKey,
      });
      return NextResponse.json(
        { success: false, error: 'Серверная ошибка: отсутствуют Supabase конфигурации' },
        { status: 500 }
      );
    }

    // Санитизация и валидация номера телефона
    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      console.error('Некорректный номер телефона:', { phone: sanitizedPhone });
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона (должен быть в формате +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Проверка, существует ли пользователь
    console.log('Проверка существования пользователя в user_profiles:', { phone: sanitizedPhone });
    const { data: existingUser, error: userError } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('phone', sanitizedPhone)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Ошибка при проверке пользователя:', userError);
      return NextResponse.json(
        { success: false, error: 'Ошибка сервера при проверке пользователя' },
        { status: 500 }
      );
    }

    // Отправляем OTP через Supabase (это вызовет Send SMS Hook)
    console.log('Отправка OTP через Supabase для:', { phone: sanitizedPhone });
    const { error } = await supabase.auth.signInWithOtp({
      phone: sanitizedPhone,
    });

    if (error) {
      console.error('Ошибка отправки SMS через Supabase:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('OTP успешно отправлен через Supabase:', { phone: sanitizedPhone });
    return NextResponse.json({ success: true, isNewUser: !existingUser });
  } catch (error: any) {
    console.error('Критическая ошибка отправки SMS:', { message: error.message, stack: error.stack });
    return NextResponse.json({ success: false, error: 'Ошибка сервера: ' + error.message }, { status: 500 });
  }
}