import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    // Валидация входных данных
    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя (можно только по user_profiles, так как Supabase Auth больше нет)
    // Если у тебя есть отдельная таблица пользователей/аутентификации — проверь по ней!
    // Если только user_profiles — используем её
    let userProfile = await prisma.user_profiles.findUnique({
      where: { phone },
      select: { name: true, phone: true },
    });

    // Если профиля нет — создаём новый (upsert-логика)
    if (!userProfile) {
      userProfile = await prisma.user_profiles.create({
        data: {
          phone,
          name: null,
          updated_at: new Date().toISOString(),
        },
        select: { name: true, phone: true },
      });
      return NextResponse.json({ success: true, name: null });
    }

    return NextResponse.json({ success: true, name: userProfile.name || null });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" &&
      console.error('Ошибка в get-profile:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
