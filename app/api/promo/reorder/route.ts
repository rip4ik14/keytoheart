// ✅ Путь: app/api/promo/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json();

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Некорректный формат данных' }, { status: 400 });
    }

    const updates = order.map(({ id, order_index }: { id: number; order_index: number }) =>
      prisma.promo_blocks.update({ where: { id }, data: { order_index } })
    );
    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error in /api/promo/reorder:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}