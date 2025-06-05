import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { cookies } = request as any;
    const userPhone = cookies.get('user_phone')?.value;

    if (userPhone && /^\+7\d{10}$/.test(userPhone)) {
      return NextResponse.json({
        success: true,
        isAuthenticated: true,
        phone: userPhone,
      });
    }

    return NextResponse.json({
      success: true,
      isAuthenticated: false,
      phone: null,
    });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} CheckSession: Error`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}