import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const normalizePhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11 && cleanPhone.startsWith('7')) {
    return `+${cleanPhone}`;
  } else if (cleanPhone.length === 10) {
    return `+7${cleanPhone}`;
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('8')) {
    return `+7${cleanPhone.slice(1)}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('7')) {
    return `+${cleanPhone}`;
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone');

    if (!rawPhone) {
      console.error(`[${new Date().toISOString()}] Missing phone parameter`);
      return NextResponse.json(
        { success: false, error: 'Номер телефона обязателен' },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizeHtml(rawPhone, { allowedTags: [], allowedAttributes: {} });
    const normalizedPhone = normalizePhone(sanitizedPhone);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('name, last_name, email, birthday, receive_offers')
      .eq('phone', normalizedPhone)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`[${new Date().toISOString()}] Error fetching profile:`, error);
      return NextResponse.json(
        { success: false, error: 'Ошибка получения профиля: ' + error.message },
        { status: 500 }
      );
    }

    const profile = data || {
      name: null,
      last_name: null,
      email: null,
      birthday: null,
      receive_offers: false,
    };

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Server error in profile:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { phone, name, last_name, email, birthday, receive_offers } = await request.json();

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    const normalizedPhone = normalizePhone(sanitizedPhone);

    const sanitizedName = sanitizeHtml(name || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedLastName = sanitizeHtml(last_name || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedEmail = sanitizeHtml(email || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedBirthday = sanitizeHtml(birthday || '', { allowedTags: [], allowedAttributes: {} });

    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          phone: normalizedPhone,
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

    console.log(`[${new Date().toISOString()}] Updated profile for phone ${normalizedPhone}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Server error in profile:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}