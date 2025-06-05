// app/api/auth/verify-sms/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: 'Данные не заполнены' },
        { status: 400 }
      );
    }
    if (!phone.startsWith('+7')) {
      return NextResponse.json(
        { success: false, error: 'Доступно только для российских номеров' },
        { status: 400 }
      );
    }

    // 1) Находим последний неиспользованный код
    const record = await prisma.sms_codes.findFirst({
      where: { phone, used: false },
      orderBy: { created_at: 'desc' },
    });
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Код не найден или истёк' },
        { status: 400 }
      );
    }

    // 2) Проверяем срок годности
    if (record.expires_at && new Date() > record.expires_at) {
      return NextResponse.json(
        { success: false, error: 'Код истёк' },
        { status: 400 }
      );
    }

    // 3) Сравниваем
    if (record.code !== code) {
      // логируем неудачную попытку в Prisma.auth_codes
      await prisma.auth_codes.create({
        data: { phone, code, created_at: new Date(), used: false },
      });
      return NextResponse.json(
        { success: false, error: 'Неверный код' },
        { status: 400 }
      );
    }

    // 4) Помечаем sms_codes как использованный
    await prisma.sms_codes.updateMany({
      where: { phone, code },
      data: { used: true },
    });

    // 5) Очищаем попытки
    await prisma.auth_codes.deleteMany({
      where: { phone },
    });

    // 6) Генерируем JWT
    const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });
    const response = NextResponse.json({ success: true, phone });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (e: any) {
    process.env.NODE_ENV !== "production" && console.error('Ошибка в verify-sms:', e);
    return NextResponse.json(
      { success: false, error: 'Серверная ошибка' },
      { status: 500 }
    );
  }
}
