import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';

interface CheckBonusResponse {
  success: boolean;
  bonus_balance: number;
  error?: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ success: false, error: 'Не указан номер' }, { status: 400 });
  }

  const phoneRegex = /^\d{10,12}$/;
  if (!phoneRegex.test(phone)) {
    return NextResponse.json({ success: false, error: 'Некорректный формат номера телефона' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bonuses')
    .select('bonus_balance')
    .eq('phone', phone)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, bonus_balance: 0 }, { status: 200 });
  }

  return NextResponse.json({ success: true, bonus_balance: data.bonus_balance } as CheckBonusResponse, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}