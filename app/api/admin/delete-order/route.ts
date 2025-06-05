import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Проверка авторизации
    const token = req.cookies.get('admin_session')?.value;
    if (!token || !(await verifyAdminJwt(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Не указан ID заказа' }, { status: 400 });
    }

    // Находим заказ
    const order = await prisma.orders.findUnique({
      where: { id },
      select: {
        phone: true,
        bonus: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    // Если за заказ были начислены бонусы, откатываем их
    if (order.bonus && order.bonus > 0) {
      // Проверяем, что phone не null
      if (!order.phone) {
        process.env.NODE_ENV !== "production" && console.error('Order phone is null for order:', id);
        return NextResponse.json({ error: 'Телефон заказа не указан' }, { status: 400 });
      }

      const bonusRecord = await prisma.bonuses.findUnique({
        where: { phone: order.phone }, // Теперь TypeScript знает, что phone не null
        select: { id: true, bonus_balance: true },
      });

      if (bonusRecord) {
        const newBalance = Math.max(0, (bonusRecord.bonus_balance ?? 0) - order.bonus);

        await prisma.$transaction([
          // Обновляем баланс бонусов
          prisma.bonuses.update({
            where: { id: bonusRecord.id },
            data: {
              bonus_balance: newBalance,
              updated_at: new Date(),
            },
          }),
          // Добавляем запись в историю
          prisma.bonus_history.create({
            data: {
              bonus_id: bonusRecord.id,
              amount: -order.bonus,
              reason: `Откат бонусов за удалённый заказ #${id}`,
              created_at: new Date(),
            },
          }),
        ]);
      }
    }

    // Удаляем заказ
    await prisma.orders.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Ошибка сервера: ' + error.message }, { status: 500 });
  }
}