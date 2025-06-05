import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      process.env.NODE_ENV !== "production" && console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Получаем все доставленные заказы пользователя
    const orders = await prisma.orders.findMany({
      where: { phone: sanitizedPhone, status: 'delivered' },
      select: { total: true, status: true },
    });

    process.env.NODE_ENV !== "production" && console.log(`[${new Date().toISOString()}] Orders fetched for phone ${sanitizedPhone}:`, orders);

    // Суммируем total, безопасно обрабатывая строки и null
    const totalSpent = orders?.reduce(
      (sum: number, order: { total: any }) => {
        const totalValue = order.total != null ? String(order.total) : '0';
        return sum + (parseFloat(totalValue) || 0);
      },
      0
    ) || 0;

    process.env.NODE_ENV !== "production" && console.log(`[${new Date().toISOString()}] Total spent (delivered orders) for phone ${sanitizedPhone}: ${totalSpent}`);

    // Определяем уровень
    let level: string;
    if (totalSpent >= 50000) level = 'premium';
    else if (totalSpent >= 30000) level = 'platinum';
    else if (totalSpent >= 20000) level = 'gold';
    else if (totalSpent >= 10000) level = 'silver';
    else level = 'bronze';

    // Обновляем уровень в таблице bonuses
    await prisma.bonuses.updateMany({
      where: { phone: sanitizedPhone },
      data: { level, updated_at: new Date().toISOString() },
    });

    process.env.NODE_ENV !== "production" && console.log(`[${new Date().toISOString()}] Updated loyalty level to ${level} for phone ${sanitizedPhone}`);

    return NextResponse.json({ success: true, level });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error(`[${new Date().toISOString()}] Server error in update-loyalty:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
