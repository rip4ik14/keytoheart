// ✅ Исправленный: app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkId = searchParams.get('checkId');
  const phone = searchParams.get('phone');

  if (!checkId || !phone) {
    return NextResponse.json({ success: false, error: 'Missing checkId or phone' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('auth_logs')
      .select('status')
      .eq('check_id', checkId)
      .eq('phone', phone)
      .single();

    if (error || !data) {
      console.error(`[${new Date().toISOString()}] Error fetching auth log:`, error);
      return NextResponse.json({ success: false, error: 'Auth log not found' }, { status: 404 });
    }

    if (data.status === 'VERIFIED') {
      return NextResponse.json({ success: true, status: 'VERIFIED', message: 'Авторизация завершена' });
    } else if (data.status === 'EXPIRED') {
      return NextResponse.json({ success: true, status: 'EXPIRED', message: 'Время верификации истекло' });
    } else {
      return NextResponse.json({ success: true, status: 'PENDING', message: 'Авторизация по звонку: номер подтвержден' });
    }
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error in auth status API:`, error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}