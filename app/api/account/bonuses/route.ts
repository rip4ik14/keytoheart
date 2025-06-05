// ✅ Путь: app/api/account/bonuses/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  process.env.NODE_ENV !== "production" && console.log('Received GET request to /api/account/bonuses:', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      process.env.NODE_ENV !== "production" &&
        console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Получаем данные по бонусам по номеру телефона
    const bonuses = await prisma.bonuses.findFirst({
      where: { phone: sanitizedPhone },
      select: {
        id: true,
        bonus_balance: true,
        level: true,
      },
    });

    process.env.NODE_ENV !== "production" && console.log(`[${new Date().toISOString()}] Bonuses response:`, bonuses);

    const data = bonuses
      ? {
          id: bonuses.id,
          bonus_balance: bonuses.bonus_balance ?? 0,
          level: bonuses.level ?? 'bronze',
        }
      : {
          id: null,
          bonus_balance: 0,
          level: 'bronze',
        };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error(`[${new Date().toISOString()}] Server error in bonuses:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  process.env.NODE_ENV !== "production" && console.log('Received POST request to /api/account/bonuses:', request.url);
  try {
    const body = await request.json();
    const { phone } = body;

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone || !/^\+7\d{10}$/.test(sanitizedPhone)) {
      process.env.NODE_ENV !== "production" &&
        console.error(`[${new Date().toISOString()}] Invalid phone format: ${sanitizedPhone}`);
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Находим bonus_id по телефону из таблицы bonuses
    const bonusRecord = await prisma.bonuses.findFirst({
      where: { phone: sanitizedPhone },
      select: { id: true },
    });

    let recentBonusActivity = null;
    if (bonusRecord) {
      // Используем bonus_id для фильтрации bonus_history
      recentBonusActivity = await prisma.bonus_history.findFirst({
        where: {
          bonus_id: bonusRecord.id,
          created_at: { gte: sixMonthsAgo },
          // phone: sanitizedPhone, // <--- этого больше нет!
        },
      });
    }

    if (recentBonusActivity) {
      process.env.NODE_ENV !== "production" &&
        console.log(`[${new Date().toISOString()}] Recent bonus activity found for phone ${sanitizedPhone}, skipping expiration`);
      return NextResponse.json({ success: true, expired: 0 });
    }

    const lastOrder = await prisma.orders.findFirst({
      where: { phone: sanitizedPhone },
      orderBy: { created_at: 'desc' },
      select: { created_at: true },
    });

    let expired = 0;
    if (lastOrder && lastOrder.created_at) {
      const lastOrderDate = new Date(lastOrder.created_at);
      if (lastOrderDate < sixMonthsAgo) {
        const currentBonus = await prisma.bonuses.findFirst({
          where: { phone: sanitizedPhone },
          select: { bonus_balance: true },
        });

        if (currentBonus && currentBonus.bonus_balance && currentBonus.bonus_balance > 0) {
          expired = currentBonus.bonus_balance;
          await prisma.bonuses.update({
            where: { phone: sanitizedPhone },
            data: { bonus_balance: 0 },
          });

          await prisma.bonus_history.create({
            data: {
              // phone: sanitizedPhone, // такого поля нет!
              amount: -expired,
              reason: 'Сгорание бонусов за неактивность (6 месяцев)',
              created_at: new Date(),
              bonus_id: bonusRecord?.id, // Связываем с bonus_id
            },
          });

          process.env.NODE_ENV !== "production" &&
            console.log(`[${new Date().toISOString()}] Expired ${expired} bonuses for phone ${sanitizedPhone}`);
        }
      }
    }

    return NextResponse.json({ success: true, expired });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" &&
      console.error(`[${new Date().toISOString()}] Server error in expire-bonuses:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
