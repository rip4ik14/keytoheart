import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { phone, name } = await request.json();

    // Валидация входных данных
    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }
    if (typeof name !== 'string' || name.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Имя должно быть строкой до 50 символов' },
        { status: 400 }
      );
    }

    // Защита от XSS
    const sanitizedName = name.replace(/[<>&'"]/g, '');

    // Проверим, есть ли профиль
    const existing = await prisma.user_profiles.findUnique({
      where: { phone },
      select: { phone: true },
    });

    if (existing) {
      // Только обновляем имя, остальные поля не трогаем!
      await prisma.user_profiles.update({
        where: { phone },
        data: { name: sanitizedName, updated_at: new Date().toISOString() },
      });
      return NextResponse.json({ success: true });
    } else {
      // Если профиля нет — создаём с обязательными полями
      await prisma.user_profiles.create({
        data: { phone, name: sanitizedName, updated_at: new Date().toISOString() },
      });
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Ошибка в update-profile:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
