import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  process.env.NODE_ENV !== "production" &&
    console.log(`${new Date().toISOString()} Incoming request to /api/admin-session:`, {
      method: req.method,
      headers: Object.fromEntries(req.headers),
      cookies: req.cookies.getAll(),
    });

  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      process.env.NODE_ENV !== "production" && console.warn(`${new Date().toISOString()} No admin_session cookie found`);
      return NextResponse.json(
        { error: 'NEAUTH', message: 'Нет сессии' },
        { status: 401 }
      );
    }

    const isValid = verifyAdminJwt(token);
    if (!isValid) {
      process.env.NODE_ENV !== "production" && console.warn(`${new Date().toISOString()} Invalid admin_session token:`, token);
      return NextResponse.json(
        { error: 'NEAUTH', message: 'Невалидная сессия' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { success: true, role: 'admin' },
      { status: 200 }
    );
    process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} Response from /api/admin-session:`, response);
    return response;
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} Error in /api/admin-session:`, err.message, err.stack);
    return NextResponse.json(
      { error: 'NEAUTH', message: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}