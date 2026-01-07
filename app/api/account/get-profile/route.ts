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

    const body = await safeBody<{ phone?: string }>(request, 'ACCOUNT GET PROFILE API');
    if (body instanceof NextResponse) {
      return body;
    }
    const { phone } = body;

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
