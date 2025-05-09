import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';

interface BonusResponse {
  success: boolean;
  data: {
    bonus_balance: number;
    level: string;
    history: { amount: number; reason: string; created_at: string }[];
  } | null;
  error?: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ success: false, error: 'Телефон не указан' }, { status: 400 });
  }

  const phoneRegex = /^\d{10,12}$/;
  if (!phoneRegex.test(phone)) {
    return NextResponse.json({ success: false, error: 'Некорректный формат номера телефона' }, { status: 400 });
  }

  const [bonusRes, historyRes] = await Promise.all([
    supabase.from('bonuses').select('bonus_balance, level').eq('phone', phone).single(),
    supabase.from('bonus_history').select('amount, reason, created_at').eq('phone', phone).order('created_at', { ascending: false }),
  ]);

  if (bonusRes.error || !bonusRes.data) {
    return NextResponse.json({ success: false, data: null }, { status: 200 });
  }

  return NextResponse.json({
    success: true,
    data: {
      bonus_balance: bonusRes.data.bonus_balance,
      level: bonusRes.data.level,
      history: historyRes.data || [],
    },
  } as BonusResponse, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}