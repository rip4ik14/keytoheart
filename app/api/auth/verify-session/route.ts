import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

export async function GET(req: Request) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error(`[${new Date().toISOString()}] Error verifying session:`, error?.message || 'No user found');
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const phone = user.user_metadata?.phone || user.phone;
    if (!phone) {
      console.error(`[${new Date().toISOString()}] No phone found for user:`, user.id);
      return NextResponse.json({ success: false, error: 'No phone associated with user' }, { status: 400 });
    }

    console.log(`[${new Date().toISOString()}] Session verified for user:`, { userId: user.id, phone });
    return NextResponse.json({
      success: true,
      userId: user.id,
      phone,
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Server error in verify-session:`, error);
    return NextResponse.json({ success: false, error: 'Server error: ' + error.message }, { status: 500 });
  }
}