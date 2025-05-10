import { NextResponse } from 'next/server';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import sanitizeHtml from 'sanitize-html';

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
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    // Санитизация номера телефона
    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone) {
      return NextResponse.json({ success: false, error: 'Телефон не указан' }, { status: 400 });
    }

    // Валидация формата телефона
    const phoneRegex = /^\+7\d{10}$/;
    if (!phoneRegex.test(sanitizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    const [bonusRes, historyRes] = await Promise.all([
      supabase.from('bonuses').select('bonus_balance, level').eq('phone', sanitizedPhone).single(),
      supabase
        .from('bonus_history')
        .select('amount, reason, created_at')
        .eq('phone', sanitizedPhone)
        .order('created_at', { ascending: false }),
    ]);

    if (bonusRes.error || !bonusRes.data) {
      console.error('Ошибка получения бонусов:', bonusRes.error);
      return NextResponse.json({ success: false, data: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          bonus_balance: bonusRes.data.bonus_balance,
          level: bonusRes.data.level,
          history: historyRes.data || [],
        },
      } as BonusResponse,
      {
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  } catch (error: any) {
    console.error('Ошибка обработки запроса бонусов:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}