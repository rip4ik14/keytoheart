import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Уровни кешбэка
const CASHBACK_LEVELS = [
  { level: 'bronze', percentage: 2.5, minTotal: 0 },
  { level: 'silver', percentage: 5, minTotal: 10000 },
  { level: 'gold', percentage: 7.5, minTotal: 20000 },
  { level: 'platinum', percentage: 10, minTotal: 30000 },
  { level: 'premium', percentage: 15, minTotal: 50000 },
];

export async function POST(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Не указаны orderId или status' }, { status: 400 });
    }

    // Обновляем статус заказа
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { status },
      select: {
        phone: true,
        total: true,
        bonuses_used: true,
        status: true,
        bonus: true,
      },
    });

    // Если статус изменился на delivered и бонусы ещё не начислены, начисляем бонусы
    if (status === 'delivered' && updatedOrder.bonus === 0) {
      // Проверяем, что phone не null
      if (!updatedOrder.phone) {
        process.env.NODE_ENV !== "production" && console.error('Order phone is null for order:', orderId);
        return NextResponse.json({ error: 'Телефон заказа не указан' }, { status: 400 });
      }

      // Проверяем, что total не null
      if (updatedOrder.total === null) {
        process.env.NODE_ENV !== "production" && console.error('Order total is null for order:', orderId);
        return NextResponse.json({ error: 'Сумма заказа не указана' }, { status: 400 });
      }

      // Получаем текущий уровень пользователя
      const bonusRecord = await prisma.bonuses.findUnique({
        where: { phone: updatedOrder.phone },
        select: { level: true, bonus_balance: true },
      });

      const currentLevel = bonusRecord?.level ?? 'bronze';
      const currentBalance = bonusRecord?.bonus_balance ?? 0;

      // Находим процент кешбэка на основе текущего уровня
      const levelObj = CASHBACK_LEVELS.find((lvl) => lvl.level === currentLevel) || CASHBACK_LEVELS[0];
      // Преобразуем total в number (если он Decimal) и вычисляем бонусы
      const totalAsNumber = typeof updatedOrder.total === 'object' && 'toNumber' in updatedOrder.total
        ? updatedOrder.total.toNumber()
        : Number(updatedOrder.total);
      const bonusAccrual = Math.floor(totalAsNumber * (levelObj.percentage / 100)); // Используем процент уровня

      // Начисляем бонусы
      await prisma.bonuses.upsert({
        where: { phone: updatedOrder.phone },
        update: {
          bonus_balance: { increment: bonusAccrual },
          updated_at: new Date(),
          bonus_history: {
            create: {
              amount: bonusAccrual,
              reason: `Начисление за заказ #${orderId}`,
            },
          },
        },
        create: {
          phone: updatedOrder.phone,
          bonus_balance: bonusAccrual,
          level: 'bronze',
          total_spent: totalAsNumber,
          total_bonus: bonusAccrual,
          updated_at: new Date(),
          bonus_history: {
            create: {
              amount: bonusAccrual,
              reason: `Начисление за заказ #${orderId}`,
            },
          },
        },
      });

      // Обновляем заказ с начисленным количеством бонусов
      await prisma.orders.update({
        where: { id: orderId },
        data: { bonus: bonusAccrual },
      });

      process.env.NODE_ENV !== "production" && console.log(`Начислено ${bonusAccrual} бонусов за заказ #${orderId} на уровне ${currentLevel}`);
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Ошибка сервера: ' + error.message }, { status: 500 });
  }
}