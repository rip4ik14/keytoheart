import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing admin session token' },
        { status: 401 }
      );
    }

    const isValidToken = await verifyAdminJwt(token);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin session token' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API /check-admin-session GET error:', err);
    return NextResponse.json(
      { error: 'Server error: ' + err.message },
      { status: 500 }
    );
  }
}