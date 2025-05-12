import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, JWT_SECRET) as { phone: string };

    return NextResponse.json({ success: true, phone: decoded.phone });
  } catch (e: any) {
    console.error('Server error:', e);
    return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
  }
}