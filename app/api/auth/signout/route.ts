// ✅ Исправленный: app/api/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('sb-access-token'); // Удаляем правильную куки
    return response;
  } catch (e: any) {
    console.error('Server error:', e);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}