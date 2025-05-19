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
    const { phone, events } = await request.json();

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Проверяем существование профиля в user_profiles
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

    // Проверяем, что events — это массив
    if (!Array.isArray(events)) {
      console.error(`[${new Date().toISOString()}] Invalid events format: ${JSON.stringify(events)}`);
      return NextResponse.json(
        { success: false, error: 'События должны быть переданы в виде массива' },
        { status: 400 }
      );
    }

    // Удаляем существующие события для данного телефона
    const { error: deleteError } = await supabase
      .from('important_dates')
      .delete()
      .eq('phone', sanitizedPhone);

    if (deleteError) {
      console.error(`[${new Date().toISOString()}] Error deleting existing important dates:`, deleteError);
      return NextResponse.json(
        { success: false, error: 'Ошибка удаления старых дат: ' + deleteError.message },
        { status: 500 }
      );
    }

    // Подготавливаем данные для вставки
    const sanitizedEvents = events.map((event: { type: string; date: string; description: string }) => ({
      phone: sanitizedPhone,
      type: sanitizeHtml(event.type || '', { allowedTags: [], allowedAttributes: {} }),
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : null,
      description: sanitizeHtml(event.description || '', { allowedTags: [], allowedAttributes: {} }) || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Вставляем новые события
    const { error: insertError } = await supabase
      .from('important_dates')
      .insert(sanitizedEvents);

    if (insertError) {
      console.error(`[${new Date().toISOString()}] Error inserting important dates:`, insertError);
      return NextResponse.json(
        { success: false, error: 'Ошибка сохранения дат: ' + insertError.message },
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
      .from('important_dates')
      .select('type, date, description')
      .eq('phone', sanitizedPhone);

    if (error) {
      console.error(`[${new Date().toISOString()}] Error fetching important dates:`, error);
      return NextResponse.json(
        { success: false, error: 'Ошибка получения дат: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Server error in important-dates:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}