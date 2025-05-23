// ✅ Путь: app/api/admin-session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    // Логирование входящего запроса
    console.log(`[${timestamp}] GET /api/admin-session - Headers:`, {
      cookie: req.headers.get('cookie'),
      userAgent: req.headers.get('user-agent'),
    });

    // Получаем токен из cookies
    const token = req.cookies.get('admin_session')?.value;
    
    if (!token) {
      console.warn(`[${timestamp}] No admin_session cookie found`);
      return NextResponse.json(
        { 
          success: false,
          error: 'NO_SESSION', 
          message: 'Токен администратора не найден' 
        },
        { status: 401 }
      );
    }

    console.log(`[${timestamp}] Verifying admin token: ${token.substring(0, 20)}...`);

    // Проверяем валидность токена
    let isValid = false;
    try {
      isValid = await verifyAdminJwt(token);
    } catch (verifyError) {
      console.error(`[${timestamp}] Token verification error:`, verifyError);
      return NextResponse.json(
        { 
          success: false,
          error: 'INVALID_TOKEN', 
          message: 'Ошибка проверки токена' 
        },
        { status: 401 }
      );
    }

    if (!isValid) {
      console.warn(`[${timestamp}] Invalid admin_session token`);
      return NextResponse.json(
        { 
          success: false,
          error: 'INVALID_SESSION', 
          message: 'Недействительный токен администратора' 
        },
        { status: 401 }
      );
    }

    console.log(`[${timestamp}] Admin session verified successfully`);

    // Возвращаем успешный ответ
    const response = NextResponse.json(
      { 
        success: true, 
        role: 'admin',
        message: 'Авторизация подтверждена'
      },
      { status: 200 }
    );

    // Устанавливаем правильные заголовки для CORS
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error: any) {
    console.error(`[${timestamp}] Unexpected error in /api/admin-session:`, {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'INTERNAL_ERROR', 
        message: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    );
  }
}

// Поддерживаем POST запросы для совместимости
export async function POST(req: NextRequest) {
  return GET(req);
}