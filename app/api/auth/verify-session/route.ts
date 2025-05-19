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
    const tokenMatch = cookies.match(/sb-gwbeabfkknhewwoesqax-auth-token=([^;]+)/);
    let accessToken: string | undefined = tokenMatch ? decodeURIComponent(tokenMatch[1]) : undefined;

    if (!accessToken) {
      // Очистка повреждённых cookies
      const response = NextResponse.json({ success: false, error: 'No auth token found' }, { status: 401 });
      response.headers.set(
        'Set-Cookie',
        `sb-gwbeabfkknhewwoesqax-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      );
      return response;
    }

    // Попытка парсинга токена
    try {
      accessToken = JSON.parse(accessToken).access_token;
    } catch (e) {
      const response = NextResponse.json({ success: false, error: 'Invalid auth token format' }, { status: 401 });
      response.headers.set(
        'Set-Cookie',
        `sb-gwbeabfkknhewwoesqax-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      );
      return response;
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      const response = NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      response.headers.set(
        'Set-Cookie',
        `sb-gwbeabfkknhewwoesqax-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      );
      return response;
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
    const response = NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    response.headers.set(
      'Set-Cookie',
      `sb-gwbeabfkknhewwoesqax-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    );
    return response;
  }
}