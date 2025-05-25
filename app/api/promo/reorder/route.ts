import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json();

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Некорректный формат данных' }, { status: 400 });
    }

    // Обновляем все order_index одной транзакцией
    await prisma.$transaction(
      order.map(({ id, order_index }: { id: number; order_index: number }) =>
        prisma.promo_blocks.update({
          where: { id },
          data: { order_index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
