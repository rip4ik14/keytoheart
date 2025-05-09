import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Исправляем на createRouteHandlerClient
import { NextResponse } from 'next/server';

const DEV_PHONE = process.env.NEXT_PUBLIC_DEV_PHONE!;
const DEV_PASS = process.env.ADMIN_PASSWORD!;

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies }); // Исправляем метод

  const { data, error } = await supabase.auth.signInWithPassword({
    phone: DEV_PHONE,
    password: DEV_PASS,
  });

  if (error) {
    return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}