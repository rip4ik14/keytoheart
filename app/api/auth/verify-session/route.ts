// ✅ Исправленный: app/api/session/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: true, persistSession: false } }
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value; // Используем ту же куки, что в /api/auth/status

    if (!token) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    // Проверяем токен
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      console.error('Invalid token:', userError);
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json({ success: true, phone: userData.user.phone });
  } catch (e: any) {
    console.error('Server error:', e);
    return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
  }
}