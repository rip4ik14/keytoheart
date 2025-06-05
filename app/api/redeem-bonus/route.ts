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
    const { phone: rawPhone, amount, order_id } = await req.json();

    if (typeof rawPhone !== 'string' || typeof amount !== 'number' || !order_id) {
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
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Сумма должна быть больше 0' },
        { status: 400 }
      );
    }

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

    const currentBalance = bonusRow.bonus_balance ?? 0;
    if (currentBalance < amount) {
      return NextResponse.json(
        { success: false, error: 'Недостаточно бонусов' },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - amount;

    // Транзакция
    await prisma.$transaction([
      prisma.bonuses.update({
        where: { id: bonusRow.id }, // Используем id вместо phone
        data: { bonus_balance: newBalance, updated_at: new Date() },
      }),
      prisma.bonus_history.create({
        data: {
          bonus_id: bonusRow.id,
          amount: -amount,
          reason: `Списание за заказ #${order_id}`,
          created_at: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('Error redeeming bonuses:', err);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + err.message },
      { status: 500 }
    );
  }
}