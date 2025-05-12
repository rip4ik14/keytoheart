import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createBrowserClient } from '@supabase/ssr';

const SMSRU_API_ID = process.env.SMSRU_API_ID!;
const JWT_SECRET = process.env.JWT_SECRET!;

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { phone, checkId } = await request.json();
    if (!phone || !checkId) {
      return NextResponse.json({ success: false, error: 'Phone and checkId are required' }, { status: 400 });
    }

    const smsResponse = await fetch(
      `https://sms.ru/callcheck/status?api_id=${SMSRU_API_ID}&check_id=${checkId}&json=1`
    );
    const result = await smsResponse.json();

    if (result.status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Failed to verify call' }, { status: 500 });
    }

    if (result.check_status !== '401') {
      return NextResponse.json({ success: false, error: 'Call not verified yet' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name')
      .eq('phone', phone)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
      throw new Error(`Profile fetch error: ${profileError.message}`);
    }

    const name = profile?.name || '';

    const { data: bonuses, error: bonusesError } = await supabase
      .from('bonuses')
      .select('bonus_balance')
      .eq('phone', phone)
      .single();

    if (bonusesError && bonusesError.code !== 'PGRST116') {
      console.error('Bonuses fetch error:', bonusesError);
      throw new Error(`Bonuses fetch error: ${bonusesError.message}`);
    }

    const bonusBalance = bonuses?.bonus_balance || 0;

    const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });
    const nextResponse = NextResponse.json({ success: true, name, bonusBalance }, { status: 200 });

    nextResponse.cookies.set('auth_token', token, {
      path: '/',
      maxAge: 604800,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return nextResponse;
  } catch (error: any) {
    console.error('Error verifying call via SMS.ru:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify call' }, { status: 500 });
  }
}