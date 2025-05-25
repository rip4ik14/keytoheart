import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BONUS_EXPIRE_DAYS = 180; // 6 месяцев

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер телефона' },
        { status: 400 }
      );
    }

    // Получаем запись о бонусах
    const bonusRow = await prisma.bonuses.findFirst({
      where: { phone },
      select: { id: true, bonus_balance: true },
    });

    if (!bonusRow) {
      return NextResponse.json(
        { success: false, error: 'Бонусы не найдены' },
        { status: 404 }
      );
    }

    const bonusId = bonusRow.id;

    // Получаем историю начислений/списаний по этому бонусу
    const history = await prisma.bonus_history.findMany({
      where: { bonus_id: bonusId },
      select: { id: true, amount: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });

    // 1. Считаем остатки для каждой начисленной порции бонусов (FIFO)
    type Accrual = {
      id: number;
      amount: number;
      created_at: string;
      spent: number;
    };

    let balanceByAccrual: Accrual[] = [];

    for (const entry of history || []) {
      const accrualId = typeof entry.id === 'string' ? Number(entry.id) : entry.id;
      const accrualAmount = Number(entry.amount ?? 0);
      const accrualDate = entry.created_at ?? '';
      if (accrualAmount > 0) {
        // Начисление
        balanceByAccrual.push({
          id: accrualId,
          amount: accrualAmount,
          created_at: accrualDate,
          spent: 0,
        });
      } else {
        // Списание или сгорание
        let toSpend = -accrualAmount;
        for (let accrual of balanceByAccrual) {
          const available = accrual.amount - accrual.spent;
          if (available <= 0) continue;
          const spendNow = Math.min(toSpend, available);
          accrual.spent += spendNow;
          toSpend -= spendNow;
          if (toSpend <= 0) break;
        }
      }
    }

    // 2. Для каждой порции начисления считаем: если не потрачено и >180 дней — сгорает
    const now = new Date();
    const expiredAccruals = balanceByAccrual
      .filter(acc => acc.amount - acc.spent > 0)
      .filter(acc => {
        const dt = acc.created_at ? new Date(acc.created_at) : new Date(0);
        const diffDays = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays > BONUS_EXPIRE_DAYS;
      });

    // Если есть бонусы, которые должны сгореть, делаем списания
    let expiredSum = 0;
    for (const acc of expiredAccruals) {
      const toExpire = acc.amount - acc.spent;
      expiredSum += toExpire;
      await prisma.bonus_history.create({
        data: {
          bonus_id: bonusId,
          amount: -toExpire,
          reason: `Сгорание бонусов спустя 6 месяцев`,
          created_at: new Date().toISOString(),
        },
      });
    }

    // 3. Пересчитываем общий баланс
    const historyAfter = await prisma.bonus_history.findMany({
      where: { bonus_id: bonusId },
      select: { amount: true },
    });

    const newBalance = (historyAfter || []).reduce(
      (sum: number, row: { amount: number | string | null }) => sum + Number(row.amount ?? 0),
      0
    );

    await prisma.bonuses.update({
      where: { id: bonusId },
      data: {
        bonus_balance: newBalance,
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      expired: expiredSum,
      new_balance: newBalance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
