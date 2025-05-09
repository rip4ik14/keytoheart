// ✅ Путь: app/api/admin-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'NEAUTH', message: 'Нет сессии' }, { status: 401 });
    }

    const isValid = verifyAdminJwt(token);
    if (!isValid) {
      return NextResponse.json({ error: 'NEAUTH', message: 'Невалидная сессия' }, { status: 401 });
    }

    return NextResponse.json({ success: true, role: 'admin' });
  } catch (err: any) {
    console.error('Error in /api/admin-session:', err);
    return NextResponse.json(
      { error: 'NEAUTH', message: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}