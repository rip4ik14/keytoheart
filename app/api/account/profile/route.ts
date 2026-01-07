// ✅ Путь: app/api/account/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone } from '@/lib/normalizePhone';
import { safeBody } from '@/lib/api/safeBody';
import { requireCsrf } from '@/lib/api/csrf';

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

    const sanitized = sanitizeHtml(rawPhone, { allowedTags: [], allowedAttributes: {} });
    const phone = normalizePhone(sanitized);

    if (!/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    const profile = await prisma.user_profiles.findUnique({
      where: { phone },
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
    process.env.NODE_ENV !== 'production' && console.error('[account/profile GET]', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrfError = requireCsrf(request);
    if (csrfError) {
      return csrfError;
    }

    const body = await safeBody<{
      phone?: string;
      name?: string;
      last_name?: string;
      email?: string;
      birthday?: string;
      receive_offers?: boolean;
    }>(request, 'ACCOUNT PROFILE API');
    if (body instanceof NextResponse) {
      return body;
    }
    const { phone, name, last_name, email, birthday, receive_offers } = body;

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    const normalizedPhone = normalizePhone(sanitizedPhone);

    if (!/^\+7\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeHtml(name || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedLastName = sanitizeHtml(last_name || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedEmail = sanitizeHtml(email || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedBirthday = sanitizeHtml(birthday || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedBirthdayNormalized = sanitizedBirthday ? sanitizedBirthday : null;

    const existingProfile = await prisma.user_profiles.findUnique({
      where: { phone: normalizedPhone },
      select: { birthday: true },
    });

    const birthdayValue = existingProfile?.birthday ?? sanitizedBirthdayNormalized;

    await prisma.user_profiles.upsert({
  where: { phone: normalizedPhone },
  update: {
    name: sanitizedName || null,
    last_name: sanitizedLastName || null,
    email: sanitizedEmail || null,
    birthday: birthdayValue,
    receive_offers: receive_offers ?? false,
    updated_at: new Date(),
  },
  create: {
    phone: normalizedPhone,
    name: sanitizedName || null,
    last_name: sanitizedLastName || null,
    email: sanitizedEmail || null,
    birthday: sanitizedBirthdayNormalized,
    receive_offers: receive_offers ?? false,
    created_at: new Date(),
    updated_at: new Date(),
  },
});


    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('[account/profile POST]', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
