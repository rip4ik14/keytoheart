import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// ⚠️ Не забудь прописать свой ключ в .env: SMS_RU_API_ID
const JWT_SECRET = process.env.JWT_SECRET!;
const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;

// POST { phone, check_id, code }
export async function POST(request: Request) {
  try {
    const { phone, check_id, code } = await request.json();

    if (!phone || !check_id || !code) {
      return NextResponse.json({ success: false, error: 'Данные не заполнены' }, { status: 400 });
    }

    // Только российские номера (+7) — жесткая проверка
    if (!phone.startsWith('+7')) {
      return NextResponse.json({ success: false, error: 'Доступно только для российских номеров' }, { status: 400 });
    }

    // Проверяем код через SMS.ru
    const url = `https://sms.ru/code/call_status?api_id=${SMS_RU_API_ID}&phone=${encodeURIComponent(
      phone
    )}&check_id=${encodeURIComponent(check_id)}`;
    const apiRes = await fetch(url);
    const apiJson = await apiRes.json();

    if (!apiJson || apiJson.status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Ошибка проверки звонка' }, { status: 500 });
    }

    // Проверка кода
    if (apiJson.code !== code) {
      return NextResponse.json({ success: false, error: 'Неверный код' }, { status: 400 });
    }

    // Всё ок — ставим токен
    const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });
    const response = NextResponse.json({ success: true, phone });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (e: any) {
    console.error('Ошибка в verify-call:', e);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}
