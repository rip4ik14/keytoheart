import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    // Проверка авторизации
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }

    const csrfToken = uuidv4();
    // Здесь можно сохранить токен в сессии или базе данных для проверки
    return NextResponse.json({ csrfToken }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/csrf-token error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}