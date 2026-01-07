import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireCsrf } from '@/lib/api/csrf';

export async function POST(req: NextRequest) {
  try {
    const csrfError = requireCsrf(req);
    if (csrfError) {
      return csrfError;
    }

    // Добавляем await для получения объекта cookies
    const cookieStore = await cookies();

    // Удаляем все cookies, начинающиеся с 'sb-'
    for (const cookie of cookieStore.getAll()) {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.delete(cookie.name);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error clearing Supabase cookies:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
