import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload: id and status are required' },
        { status: 400 }
      );
    }

    // Проверка токена
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing admin session token' },
        { status: 401 }
      );
    }
    const isValidToken = await verifyAdminJwt(token);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin session token' },
        { status: 401 }
      );
    }

    // Проверяем заказ
    const order = await prisma.orders.findUnique({
      where: { id }, // id как строка (UUID)
      select: { id: true, phone: true, bonus: true, user_id: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Проверяем допустимые статусы
    const validStatuses = [
      'Ожидает подтверждения',
      'В сборке',
      'Доставляется',
      'Доставлен',
      'Отменён',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Если уже был "Доставлен", не начисляем ещё раз
    if (order.status === 'Доставлен' && status === 'Доставлен') {
      return NextResponse.json(
        { error: 'Order already completed, bonuses already accrued' },
        { status: 400 }
      );
    }

    // Обновляем статус заказа
    await prisma.orders.update({
      where: { id },
      data: { status },
    });

    // Начисляем бонусы только если заказ доставлен (и был не доставлен)
    if (status === 'Доставлен' && order.status !== 'Доставлен' && order.bonus > 0) {
      if (!order.phone) {
        return NextResponse.json(
          { error: 'Cannot accrue bonuses: Order has no phone number' },
          { status: 400 }
        );
      }

      const bonusData = await prisma.bonuses.findUnique({
        where: { phone: order.phone },
        select: { id: true, bonus_balance: true, total_spent: true, level: true },
      });

      if (!bonusData) {
        return NextResponse.json(
          { error: 'Failed to fetch bonus data' },
          { status: 500 }
        );
      }

      // Добавляем бонус к балансу
      const newBalance = (bonusData.bonus_balance || 0) + (order.bonus || 0);

      await prisma.bonuses.update({
        where: { id: bonusData.id },
        data: {
          bonus_balance: newBalance,
          updated_at: new Date(),
        },
      });

      // Запись в историю
      await prisma.bonus_history.create({
        data: {
          bonus_id: bonusData.id,
          amount: order.bonus,
          reason: `Начисление бонусов за заказ #${id}`,
          created_at: new Date(),
          user_id: order.user_id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('Error updating order status:', err);
    return NextResponse.json(
      { error: 'Server error: ' + err.message },
      { status: 500 }
    );
  }
}