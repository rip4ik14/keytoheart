import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const userPhone = request.cookies.get('user_phone')?.value;
  if (!userPhone || !/^\+7\d{10}$/.test(userPhone)) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: { phone: userPhone } }, { status: 200 });
}
