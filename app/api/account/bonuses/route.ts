import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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
      .from('bonuses')
      .select('id, bonus_balance, level')
      .eq('phone', sanitizedPhone)
      .limit(1)
      .single();

    console.log(`[${new Date().toISOString()}] Bonuses response:`, { data, error });

    if (error && error.code !== 'PGRST116') {
      console.error(`[${new Date().toISOString()}] Bonuses fetch error:`, error);
      return NextResponse.json(
        { success: false, error: 'Ошибка получения бонусов: ' + error.message },
        { status: 500 }
      );
    }

    const bonuses = data
      ? { id: data.id, bonus_balance: data.bonus_balance ?? 0, level: data.level ?? 'bronze' }
      : { id: null, bonus_balance: 0, level: 'bronze' };

    return NextResponse.json({ success: true, data: bonuses });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Server error in bonuses:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}