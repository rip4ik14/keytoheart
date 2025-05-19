import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Используем сервисный ключ для обхода RLS
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { phone, birthday, anniversary } = await request.json();

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Проверяем существование профиля в user_profiles вместо auth.users
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('phone', sanitizedPhone)
      .single();

    if (!profile) {
      console.error(`[${new Date().toISOString()}] Profile not found for phone: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Профиль с таким телефоном не найден' },
        { status: 404 }
      );
    }

    // Обновляем профиль
    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          phone: sanitizedPhone,
          birthday: sanitizeHtml(birthday || '', { allowedTags: [], allowedAttributes: {} }) || null,
          anniversary: sanitizeHtml(anniversary || '', { allowedTags: [], allowedAttributes: {} }) || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone' }
      );

    if (error) {
      console.error(`[${new Date().toISOString()}] Error updating important dates:`, error);
      return NextResponse.json(
        { success: false, error: 'Ошибка обновления дат: ' + error.message },
        { status: 500 }
      );
    }

    console.log(`[${new Date().toISOString()}] Updated important dates for phone ${sanitizedPhone}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Server error in important-dates:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('birthday, anniversary')
      .eq('phone', sanitizedPhone)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`[${new Date().toISOString()}] Error fetching important dates:`, error);
      return NextResponse.json(
        { success: false, error: 'Ошибка получения дат: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || { birthday: null, anniversary: null },
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Server error in important-dates:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}