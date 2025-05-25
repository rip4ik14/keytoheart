import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

const prisma = new PrismaClient();

const normalizePhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11 && cleanPhone.startsWith('7')) {
    return `+${cleanPhone}`;
  } else if (cleanPhone.length === 10) {
    return `+7${cleanPhone}`;
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('8')) {
    return `+7${cleanPhone.slice(1)}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('7')) {
    return `+${cleanPhone}`;
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone');

    if (!rawPhone) {
      return NextResponse.json(
        { success: false, error: 'Номер телефона обязателен' },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizeHtml(rawPhone, { allowedTags: [], allowedAttributes: {} });
    const normalizedPhone = normalizePhone(sanitizedPhone);

    const profile = await prisma.user_profiles.findUnique({
      where: { phone: normalizedPhone },
      select: {
        name: true,
        last_name: true,
        email: true,
        birthday: true,
        receive_offers: true,
      },
    });

    const data = profile || {
      name: null,
      last_name: null,
      email: null,
      birthday: null,
      receive_offers: false,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { phone, name, last_name, email, birthday, receive_offers } = await request.json();

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    const normalizedPhone = normalizePhone(sanitizedPhone);

    const sanitizedName = sanitizeHtml(name || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedLastName = sanitizeHtml(last_name || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedEmail = sanitizeHtml(email || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedBirthday = sanitizeHtml(birthday || '', { allowedTags: [], allowedAttributes: {} });

    // upsert: если профиль есть — обновляем, если нет — создаём
    await prisma.user_profiles.upsert({
      where: { phone: normalizedPhone },
      update: {
        name: sanitizedName || null,
        last_name: sanitizedLastName || null,
        email: sanitizedEmail || null,
        birthday: sanitizedBirthday || null,
        receive_offers: receive_offers ?? false,
        updated_at: new Date().toISOString(),
      },
      create: {
        phone: normalizedPhone,
        name: sanitizedName || null,
        last_name: sanitizedLastName || null,
        email: sanitizedEmail || null,
        birthday: sanitizedBirthday || null,
        receive_offers: receive_offers ?? false,
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
