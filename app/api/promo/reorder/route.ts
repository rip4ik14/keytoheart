import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeBody } from '@/lib/api/safeBody';

export async function POST(req: NextRequest) {
  try {
    const body = await safeBody<{ order?: Array<{ id: number; order_index: number }> }>(
      req,
      'PROMO REORDER API',
    );
    if (body instanceof NextResponse) {
      return body;
    }
    const { order } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Некорректный формат данных' }, { status: 400 });
    }

    await prisma.$transaction(
      order.map(({ id, order_index }: { id: number; order_index: number }) =>
        prisma.promo_blocks.update({
          where: { id: Number(id) },
          data: { order_index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' &&
      console.error('Error in /api/promo/reorder:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
