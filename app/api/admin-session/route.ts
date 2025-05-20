import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      console.warn('No admin_session cookie found');
      return NextResponse.json(
        { error: 'NEAUTH', message: 'Нет сессии' },
        { status: 401 }
      );
    }

    const isValid = verifyAdminJwt(token);
    if (!isValid) {
      console.warn('Invalid admin_session token:', token);
      return NextResponse.json(
        { error: 'NEAUTH', message: 'Невалидная сессия' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, role: 'admin', token },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error in /api/admin-session:', err.message, err.stack);
    return NextResponse.json(
      { error: 'NEAUTH', message: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}