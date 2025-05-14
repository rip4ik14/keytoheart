import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkId = searchParams.get('checkId');

  if (!checkId) {
    return NextResponse.json({ success: false, error: 'checkId required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('auth_logs')
    .select('status')
    .eq('check_id', checkId)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, status: 'unknown' });
  }

  return NextResponse.json({ success: true, status: data.status });
}
