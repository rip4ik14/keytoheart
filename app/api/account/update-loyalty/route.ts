// ✅ Путь: app/api/account/update-loyalty/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone, buildPhoneVariants } from '@/lib/normalizePhone';
import { safeBody } from '@/lib/api/safeBody';
import { requireCsrf } from '@/lib/api/csrf';

export async function POST(request: NextRequest) {
  try {
    const csrfError = requireCsrf(request);
    if (csrfError) {
      return csrfError;
    }

    const body = await safeBody<{ phone?: string }>(request, 'ACCOUNT UPDATE LOYALTY API');
    if (body instanceof NextResponse) {
      return body;
    }
    const rawPhone = body?.phone;

    const sanitizedInput = sanitizeHtml(String(rawPhone || ''), {
      allowedTags: [],
      allowedAttributes: {},
    });

    const normalized = normalizePhone(sanitizedInput); // +7XXXXXXXXXX

    if (!normalized || !/^\+7\d{10}$/.test(normalized)) {
      process.env.NODE_ENV !== 'production' &&
        console.error('[update-loyalty] invalid phone:', sanitizedInput, '->', normalized);

      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    const variants = buildPhoneVariants(normalized); // +7..., 7..., 8..., last10

    // 1) Берём только доставленные заказы (у тебя в БД это delivered)
    const deliveredOrders = await prisma.orders.findMany({
      where: {
        status: 'delivered',
        OR: variants.map((p) => ({ phone: p })),
      },
      select: { total: true },
    });

    const totalSpent =
      deliveredOrders.reduce((sum: number, order: any) => {
        const v = order?.total != null ? Number(order.total) : 0;
        return sum + (Number.isFinite(v) ? v : 0);
      }, 0) || 0;

    // 2) Определяем уровень
    let level: string;
    if (totalSpent >= 50000) level = 'premium';
    else if (totalSpent >= 30000) level = 'platinum';
    else if (totalSpent >= 20000) level = 'gold';
    else if (totalSpent >= 10000) level = 'silver';
    else level = 'bronze';

    // 3) Обновляем bonuses по всем вариантам телефона
    // Плюс сразу фиксируем total_spent, чтобы в базе было актуально
    const updated = await prisma.bonuses.updateMany({
      where: {
        OR: variants.map((p) => ({ phone: p })),
      },
      data: {
        level,
        total_spent: totalSpent,
        updated_at: new Date().toISOString(),
      },
    });

    // Если записи bonuses не было, можно создать (чтобы уровни работали сразу)
    if (updated.count === 0) {
      await prisma.bonuses.create({
        data: {
          phone: normalized,
          level,
          total_spent: totalSpent,
          bonus_balance: 0,
          updated_at: new Date().toISOString(),
        } as any,
      });
    }

    return NextResponse.json({ success: true, phone: normalized, level, total_spent: totalSpent });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error('[update-loyalty] server error:', error);

    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + (error?.message || 'unknown') },
      { status: 500 }
    );
  }
}
