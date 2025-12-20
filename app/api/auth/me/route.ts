import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/normalizePhone';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)user_phone=([^;]+)/);
  const raw = match ? decodeURIComponent(match[1]) : '';
  const phone = normalizePhone(raw);

  if (!phone || !/^\+7\d{10}$/.test(phone)) {
    return NextResponse.json({ success: true, isAuthenticated: false, phone: null });
  }

  return NextResponse.json({ success: true, isAuthenticated: true, phone });
}
