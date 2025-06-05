// app/api/bonuses/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+7' + digits;
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8')))
    return '+7' + digits.slice(-10);
  return raw.startsWith('+') ? raw : '+' + raw;
}

export async function POST(req: NextRequest) {
  try {
    const { phone: rawPhone, amount, reason } = await req.json();

    // в теле ожидаем phone, amount (число, может быть отрицательное для списания) и reason
    if (
      typeof rawPhone !== 'string' ||
      typeof amount !== 'number' ||
      typeof reason !== 'string' ||
      !reason.trim()
    ) {
      return NextResponse.json(
        { success: false, error: 'Неверные входные данные' },
        { status: 400 }
      );
    }

    const phone = normalizePhone(
      sanitizeHtml(rawPhone, { allowedTags: [], allowedAttributes: {} })
    );

    if (!/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат телефона (+7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // получаем запись bonuses по номеру
    const bonusRow = await prisma.bonuses.findUnique({
      where: { phone },
      select: { id: true, bonus_balance: true },
    });

    if (!bonusRow) {
      return NextResponse.json(
        { success: false, error: 'Бонусы не найдены для этого номера' },
        { status: 404 }
      );
    }

    const current = bonusRow.bonus_balance ?? 0;
    const newBalance = current + amount;
    if (newBalance < 0) {
      return NextResponse.json(
        { success: false, error: 'Баланс не может стать отрицательным' },
        { status: 400 }
      );
    }

    // проводим транзакцию: обновляем баланс и пишем в историю
    await prisma.$transaction([
      prisma.bonuses.update({
        where: { id: bonusRow.id },
        data: { bonus_balance: newBalance, updated_at: new Date() },
      }),
      prisma.bonus_history.create({
        data: {
          bonus_id: bonusRow.id,
          amount,
          reason: sanitizeHtml(reason, { allowedTags: [], allowedAttributes: {} }),
          created_at: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('Error in /api/bonuses/update:', err);
    return NextResponse.json(
      { success: false, error: 'Серверная ошибка: ' + err.message },
      { status: 500 }
    );
  }
}
