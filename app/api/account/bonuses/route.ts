// ✅ Путь: app/api/account/bonuses/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { normalizePhone, buildPhoneVariants } from '@/lib/normalizePhone';

const log = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[account/bonuses]', ...args);
  }
};

const logError = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[account/bonuses]', ...args);
  }
};

export async function GET(request: Request) {
  log('GET', request.url);

  try {
    const { searchParams } = new URL(request.url);
    const phoneParam = searchParams.get('phone') || '';

    const sanitizedPhoneInput = sanitizeHtml(phoneParam, {
      allowedTags: [],
      allowedAttributes: {},
    });

    const normalizedPhone = normalizePhone(sanitizedPhoneInput);
    const variants = buildPhoneVariants(normalizedPhone);

    if (!variants.length) {
      logError('Invalid phone (not enough digits):', sanitizedPhoneInput);
      return NextResponse.json(
        {
          success: false,
          error: 'Некорректный формат номера (должно быть не менее 10 цифр)',
        },
        { status: 400 },
      );
    }

    const phoneWhere = {
      OR: variants.map((p: string) => ({ phone: p })),
    };

    // 🔥 ВАЖНО: берём запись с максимальным балансом (если есть дубликаты)
    const bonuses = await prisma.bonuses.findFirst({
      where: phoneWhere,
      orderBy: {
        bonus_balance: 'desc', // сначала те, где баланс максимальный
      },
      select: {
        id: true,
        phone: true,
        bonus_balance: true,
        level: true,
      },
    });

    log('Bonuses response:', bonuses);

    const data = bonuses
      ? {
          id: bonuses.id,
          // возвращаем канонический формат, чтобы фронт везде видел один и тот же номер
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
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  log('POST expire-check');

  try {
    const body = await request.json();
    const phoneParam: string = body?.phone || '';

    const sanitizedPhoneInput = sanitizeHtml(phoneParam, {
      allowedTags: [],
      allowedAttributes: {},
    });

    const normalizedPhone = normalizePhone(sanitizedPhoneInput);
    const variants = buildPhoneVariants(normalizedPhone);

    if (!variants.length) {
      logError('Invalid phone (not enough digits):', sanitizedPhoneInput);
      return NextResponse.json(
        {
          success: false,
          error: 'Некорректный формат номера (должно быть не менее 10 цифр)',
        },
        { status: 400 },
      );
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const phoneWhere = {
      OR: variants.map((p: string) => ({ phone: p })),
    };

    // Находим любую запись бонусов по телефону
    const bonusRecord = await prisma.bonuses.findFirst({
      where: phoneWhere,
      select: { id: true },
    });

    let recentBonusActivity = null;
    if (bonusRecord) {
      recentBonusActivity = await prisma.bonus_history.findFirst({
        where: {
          bonus_id: bonusRecord.id,
          created_at: { gte: sixMonthsAgo },
        },
      });
    }

    if (recentBonusActivity) {
      log('Recent bonus activity found, skipping expiration');
      return NextResponse.json({ success: true, expired: 0 });
    }

    // Последний заказ по любому формату этого номера
    const lastOrder = await prisma.orders.findFirst({
      where: phoneWhere,
      orderBy: { created_at: 'desc' },
      select: { created_at: true },
    });

    let expired = 0;

    if (lastOrder && lastOrder.created_at) {
      const lastOrderDate = new Date(lastOrder.created_at);

      if (lastOrderDate < sixMonthsAgo) {
        const currentBonus = await prisma.bonuses.findFirst({
          where: phoneWhere,
          orderBy: {
            bonus_balance: 'desc',
          },
          select: { bonus_balance: true },
        });

        if (currentBonus && currentBonus.bonus_balance && currentBonus.bonus_balance > 0) {
          expired = currentBonus.bonus_balance;

          // Обнуляем баланс для всех записей этого номера
          await prisma.bonuses.updateMany({
            where: phoneWhere,
            data: { bonus_balance: 0 },
          });

          await prisma.bonus_history.create({
            data: {
              amount: -expired,
              reason: 'Сгорание бонусов за неактивность (6 месяцев)',
              created_at: new Date(),
              bonus_id: bonusRecord?.id ?? null,
            },
          });

          log(`Expired ${expired} bonuses for phone variants:`, variants);
        }
      }
    }

    return NextResponse.json({ success: true, expired });
  } catch (error: any) {
    logError('Server error in POST:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 },
    );
  }
}
