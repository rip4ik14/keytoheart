import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json();

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Некорректный формат данных' }, { status: 400 });
    }

    await prisma.$transaction(
      order.map(({ id, order_index }: { id: number; order_index: number }) =>
        prisma.products.update({
          where: { id: Number(id) },
          data: { order_index },
        })
      )
    );

    revalidateTag('products');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('Error in /api/admin/products/reorder:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
