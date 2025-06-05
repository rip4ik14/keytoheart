import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { phone, events } = await request.json();

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      process.env.NODE_ENV !== "production" && console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Проверяем существование профиля (user_profiles)
    const profile = await prisma.user_profiles.findUnique({
      where: { phone: sanitizedPhone },
      select: { phone: true },
    });

    if (!profile) {
      process.env.NODE_ENV !== "production" &&
        console.error(`[${new Date().toISOString()}] Profile not found for phone: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Профиль с таким телефоном не найден' },
        { status: 404 }
      );
    }

    // Проверяем, что events — массив
    if (!Array.isArray(events)) {
      process.env.NODE_ENV !== "production" &&
        console.error(`[${new Date().toISOString()}] Invalid events format: ${JSON.stringify(events)}`);
      return NextResponse.json(
        { success: false, error: 'События должны быть переданы в виде массива' },
        { status: 400 }
      );
    }

    // Удаляем существующие события для этого телефона
    await prisma.important_dates.deleteMany({
      where: { phone: sanitizedPhone },
    });

    // Готовим новые события для вставки
    const sanitizedEvents = events.map(
      (event: { type: string; date: string; description: string }) => ({
        phone: sanitizedPhone,
        type: sanitizeHtml(event.type || '', { allowedTags: [], allowedAttributes: {} }),
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : null,
        description: sanitizeHtml(event.description || '', { allowedTags: [], allowedAttributes: {} }) || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );

    // Вставляем новые события (если есть)
    if (sanitizedEvents.length > 0) {
      await prisma.important_dates.createMany({ data: sanitizedEvents });
    }

    process.env.NODE_ENV !== "production" &&
      console.log(`[${new Date().toISOString()}] Updated important dates for phone ${sanitizedPhone}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" &&
      console.error(`[${new Date().toISOString()}] Server error in important-dates:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      process.env.NODE_ENV !== "production" && console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }
    const data = await prisma.important_dates.findMany({
      where: { phone: sanitizedPhone },
      select: { type: true, date: true, description: true },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" &&
      console.error(`[${new Date().toISOString()}] Server error in important-dates:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
