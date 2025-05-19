import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import sanitizeHtml from 'sanitize-html';

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

    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          phone: sanitizedPhone,
          birthday: birthday || null,
          anniversary: anniversary || null,
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