// ✅ Путь: app/api/account/update-loyalty/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone, buildPhoneVariants } from '@/lib/normalizePhone';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    const sanitizedInput = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    const normalizedPhone = normalizePhone(sanitizedInput);

    if (!normalizedPhone || !/^\+7\d{10}$/.test(normalizedPhone)) {
      process.env.NODE_ENV !== 'production' &&
        console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedInput}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    const variants = buildPhoneVariants(normalizedPhone); // включает +7..., 7..., 8..., last10

    // Получаем все доставленные заказы пользователя
    const orders = await prisma.orders.findMany({
      where: {
        status: 'delivered',
        OR: variants.map((p) => ({ phone: p })),
      },
      select: { total: true, status: true },
    });

    // Суммируем total, безопасно обрабатывая строки и null
    const totalSpent =
      orders?.reduce((sum: number, order: { total: any }) => {
        const totalValue = order.total != null ? String(order.total) : '0';
        return sum + (parseFloat(totalValue) || 0);
      }, 0) || 0;

    // Определяем уровень
    let level: string;
    if (totalSpent >= 50000) level = 'premium';
    else if (totalSpent >= 30000) level = 'platinum';
    else if (totalSpent >= 20000) level = 'gold';
    else if (totalSpent >= 10000) level = 'silver';
    else level = 'bronze';

    // Обновляем уровень в bonuses по всем вариантам
    await prisma.bonuses.updateMany({
      where: {
        OR: variants.map((p) => ({ phone: p })),
      },
      data: { level, updated_at: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, level, total_spent: totalSpent });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error(`[${new Date().toISOString()}] Server error in update-loyalty:`, error);

    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
