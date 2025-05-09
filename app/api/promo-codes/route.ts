// ✅ Путь: app/api/promo-codes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('id, code, discount_value, discount_type, expires_at, is_active')
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const csrfToken = req.headers.get('X-CSRF-Token');
  const storedCsrfToken = req.cookies.get('csrf_token')?.value;

  if (!csrfToken || csrfToken !== storedCsrfToken) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  try {
    const { code, discount_value, discount_type, expires_at, is_active } = await req.json();

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .insert({ code, discount_value, discount_type, expires_at, is_active })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const csrfToken = req.headers.get('X-CSRF-Token');
  const storedCsrfToken = req.cookies.get('csrf_token')?.value;

  if (!csrfToken || csrfToken !== storedCsrfToken) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  try {
    const { id, code, discount_value, discount_type, expires_at, is_active } = await req.json();

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .update({ code, discount_value, discount_type, expires_at, is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    const { error } = await supabaseAdmin.from('promo_codes').delete().eq('id', id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}