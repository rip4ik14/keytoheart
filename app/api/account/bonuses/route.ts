// ✅ Путь: app/api/account/bonuses/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone, buildPhoneVariants } from '@/lib/normalizePhone';

const log = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') console.log('[account/bonuses]', ...args);
};

const logError = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') console.error('[account/bonuses]', ...args);
};

function sanitizeInput(v: unknown): string {
  return sanitizeHtml(String(v ?? ''), { allowedTags: [], allowedAttributes: {} }).trim();
}

export async function GET(request: Request) {
  log('GET', request.url);

  try {
    const { searchParams } = new URL(request.url);
    const phoneParam = sanitizeInput(searchParams.get('phone') || '');

    const normalizedPhone = normalizePhone(phoneParam);
    const variants = buildPhoneVariants(normalizedPhone);

    if (!variants.length) {
      logError('Invalid phone (not enough digits):', phoneParam);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера (должно быть не менее 10 цифр)' },
        { status: 400 }
      );
    }

    const phoneWhere = { OR: variants.map((p) => ({ phone: p })) };

    // Выбираем “самую богатую” запись, а при равенстве - самую свежую
    const bonuses = await prisma.bonuses.findFirst({
      where: phoneWhere,
      orderBy: [{ bonus_balance: 'desc' }, { updated_at: 'desc' }],
      select: { id: true, phone: true, bonus_balance: true, level: true },
    });

    log('Bonuses response:', bonuses);

    const data = bonuses
      ? {
          id: bonuses.id,
          phone: normalizedPhone,
          bonus_balance: bonuses.bonus_balance ?? 0,
          level: bonuses.level ?? 'bronze',
        }
      : {
          id: null,
          phone: normalizedPhone,
          bonus_balance: 0,
          level: 'bronze',
        };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logError('Server error in GET:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  log('POST expire-check');

  try {
    const body = await request.json();
    const phoneParam = sanitizeInput(body?.phone || '');

    const normalizedPhone = normalizePhone(phoneParam);
    const variants = buildPhoneVariants(normalizedPhone);

    if (!variants.length) {
      logError('Invalid phone (not enough digits):', phoneParam);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера (должно быть не менее 10 цифр)' },
        { status: 400 }
      );
    }

    const phoneWhere = { OR: variants.map((p) => ({ phone: p })) };

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Всё важное делаем в транзакции, чтобы не было гонок
    const result = await prisma.$transaction(async (tx) => {
      // Берём “основную” запись бонусов (богатую/свежую) - её id пишем в историю
      const bonusMain = await tx.bonuses.findFirst({
        where: phoneWhere,
        orderBy: [{ bonus_balance: 'desc' }, { updated_at: 'desc' }],
        select: { id: true, bonus_balance: true },
      });

      // Если нет записи - нечего сжигать
      if (!bonusMain) {
        return { expired: 0 };
      }

      // Если была активность по бонусам за 6 месяцев - не сжигаем
      const recentBonusActivity = await tx.bonus_history.findFirst({
        where: { bonus_id: bonusMain.id, created_at: { gte: sixMonthsAgo } },
        select: { id: true },
      });

      if (recentBonusActivity) {
        log('Recent bonus activity found, skipping expiration');
        return { expired: 0 };
      }

      // Последний заказ по любому формату номера
      const lastOrder = await tx.orders.findFirst({
        where: phoneWhere,
        orderBy: { created_at: 'desc' },
        select: { created_at: true },
      });

      if (!lastOrder?.created_at) {
        return { expired: 0 };
      }

      const lastOrderDate = new Date(lastOrder.created_at);

      // Если последний заказ старше 6 мес - сжигаем
      if (lastOrderDate >= sixMonthsAgo) {
        return { expired: 0 };
      }

      const currentBalance = Number(bonusMain.bonus_balance ?? 0);

      if (!currentBalance || currentBalance <= 0) {
        return { expired: 0 };
      }

      // Обнуляем баланс для всех записей этого номера
      await tx.bonuses.updateMany({
        where: phoneWhere,
        data: { bonus_balance: 0, updated_at: new Date() },
      });

      // Пишем историю на бонусный счёт, который выбрали как основной
      await tx.bonus_history.create({
        data: {
          bonus_id: bonusMain.id,
          amount: -currentBalance,
          reason: 'Сгорание бонусов за неактивность (6 месяцев)',
          created_at: new Date(),
        },
      });

      log(`Expired ${currentBalance} bonuses for phone variants:`, variants);

      return { expired: currentBalance };
    });

    return NextResponse.json({ success: true, expired: result.expired });
  } catch (error: any) {
    logError('Server error in POST:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
