import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

export async function GET(req: Request) {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: true, persistSession: false },
      }
    );

    // Извлекаем токен из cookies
    const cookies = req.headers.get('cookie') || '';
    const tokenMatch = cookies.match(/sb-.*?-auth-token=([^;]+)/);
    const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'No auth token found' }, { status: 401 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const phone = user.user_metadata?.phone || user.phone;
    if (!phone) {
      return NextResponse.json({ success: false, error: 'No phone associated with user' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      phone,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Server error: ' + error.message }, { status: 500 });
  }
}