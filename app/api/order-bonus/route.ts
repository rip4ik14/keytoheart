import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';

// Уровни кешбэка
const CASHBACK_LEVELS = [
  { level: 'bronze', percentage: 2.5, minTotal: 0 },
  { level: 'silver', percentage: 5, minTotal: 10000 },
  { level: 'gold', percentage: 7.5, minTotal: 20000 },
  { level: 'platinum', percentage: 10, minTotal: 30000 },
  { level: 'premium', percentage: 15, minTotal: 50000 },
];

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+7' + digits;
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '+7' + digits.slice(-10);
  }
  return raw.startsWith('+') ? raw : '+' + raw;
}

export async function POST(request: Request) {
  try {
    const { phone: rawPhone, order_total, order_id } = await request.json();

    if (typeof rawPhone !== 'string' || typeof order_total !== 'number' || !order_id) {
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
        { success: false, error: 'Некорректный формат номера телефона' },
        { status: 400 }
      );
    }
    if (order_total < 0) {
      return NextResponse.json(
        { success: false, error: 'Некорректная сумма заказа' },
        { status: 400 }
      );
    }

    // Пытаемся получить существующую запись
    let bonusRecord = await prisma.bonuses.findUnique({
      where: { phone },
      select: { id: true, bonus_balance: true, level: true, total_spent: true, total_bonus: true },
    });

    // Если не нашли — создаём
    if (!bonusRecord) {
      bonusRecord = await prisma.bonuses.create({
        data: {
          phone,
          bonus_balance: 0,
          level: 'bronze',
          total_spent: 0,
          total_bonus: 0,
          updated_at: new Date(),
        },
        select: { id: true, bonus_balance: true, level: true, total_spent: true, total_bonus: true },
      });
    }

    const prevBalance = bonusRecord.bonus_balance ?? 0;
    const prevSpent = bonusRecord.total_spent ?? 0;
    const prevBonus = bonusRecord.total_bonus ?? 0;
    const currentLevel = bonusRecord.level ?? 'bronze';

    const newTotalSpent = prevSpent + order_total;

    // Находим процент кешбэка на основе текущего уровня
    const levelObj = CASHBACK_LEVELS.find((lvl) => lvl.level === currentLevel) || CASHBACK_LEVELS[0];

    const bonusToAdd = Math.floor(order_total * (levelObj.percentage / 100));
    const newBalance = prevBalance + bonusToAdd;
    const newTotalBonus = prevBonus + bonusToAdd;

    // Обновляем запись
    await prisma.bonuses.update({
      where: { phone },
      data: {
        bonus_balance: newBalance,
        total_spent: newTotalSpent,
        total_bonus: newTotalBonus,
        updated_at: new Date(),
      },
    });

    // Логируем историю начисления
    await prisma.bonus_history.create({
      data: {
        bonus_id: bonusRecord.id,
        amount: bonusToAdd,
        reason: `Начисление за заказ #${order_id}`,
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      bonus_added: bonusToAdd,
      new_balance: newBalance,
      level: currentLevel,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + err.message },
      { status: 500 }
    );
  }
}