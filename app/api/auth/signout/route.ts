import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('admin_session'); // Добавил также очистку admin_session, если такая есть
    return response;
  } catch (e: any) {
    process.env.NODE_ENV !== "production" && console.error('Server error:', e);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
