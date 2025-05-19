import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { phone, name, last_name, email, birthday, receive_offers } = await request.json();

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeHtml(name || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedLastName = sanitizeHtml(last_name || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedEmail = sanitizeHtml(email || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedBirthday = sanitizeHtml(birthday || '', { allowedTags: [], allowedAttributes: {} });

    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          phone: sanitizedPhone,
          name: sanitizedName || null,
          last_name: sanitizedLastName || null,
          email: sanitizedEmail || null,
          birthday: sanitizedBirthday || null,
          receive_offers: receive_offers ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone' }
      );

    if (error) {
      console.error(`[${new Date().toISOString()}] Error updating profile:`, error);
      return NextResponse.json(
        { success: false, error: 'Ошибка обновления профиля: ' + error.message },
        { status: 500 }
      );
    }

    console.log(`[${new Date().toISOString()}] Updated profile for phone ${sanitizedPhone}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Server error in profile:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}