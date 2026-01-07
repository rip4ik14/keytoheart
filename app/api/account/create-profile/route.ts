import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeBody } from '@/lib/api/safeBody';
import { requireCsrf } from '@/lib/api/csrf';

export async function POST(request: NextRequest) {
  try {
    const csrfError = requireCsrf(request);
    if (csrfError) {
      return csrfError;
    }

    const body = await safeBody<{ phone?: string; name?: string }>(
      request,
      'ACCOUNT CREATE PROFILE API',
    );
    if (body instanceof NextResponse) {
      return body;
    }
    const { phone, name } = body;

    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }

    // Проверка существования пользователя (например, в user_profiles)
    const userExists = await prisma.user_profiles.findUnique({
      where: { phone },
      select: { phone: true },
    });

    if (userExists) {
      // Профиль уже существует
      return NextResponse.json({ success: true });
    }

    // Имя не обязательно, но если есть — чистим от XSS
    const sanitizedName = typeof name === 'string'
      ? name.replace(/[<>&'"]/g, '')
      : null;

    // Создаём профиль
    await prisma.user_profiles.create({
      data: {
        phone,
        name: sanitizedName,
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" &&
      console.error('Ошибка в create-profile:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
