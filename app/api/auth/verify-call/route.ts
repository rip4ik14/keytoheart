import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: Request) {
  try {
    const { phone, check_id, code } = await request.json();

    if (!phone || !check_id || !code) {
      process.env.NODE_ENV !== "production" && console.error('Missing parameters:', { phone, check_id, code });
      return NextResponse.json({ success: false, error: 'phone, check_id, and code required' }, { status: 400 });
    }

    // Проверка через SMS.ru
    const url = `https://sms.ru/code/check?api_id=${SMS_RU_API_ID}&call_id=${check_id}&code=${code}`;
    const smsRes = await fetch(url);
    const responseText = await smsRes.text();

    const lines = responseText.trim().split('\n');
    if (lines[0] !== '100') {
      return NextResponse.json({ success: false, error: 'Неверный код' }, { status: 400 });
    }

    // Обновляем статус в auth_logs
    const updated = await prisma.auth_logs.updateMany({
      where: { check_id },
      data: { status: 'VERIFIED', updated_at: new Date() },
    });

    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: 'check_id не найден в базе' }, { status: 404 });
    }

    // Генерация JWT
    const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Ошибка в verify-call:', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
