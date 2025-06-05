import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { phone, name } = await request.json();

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
