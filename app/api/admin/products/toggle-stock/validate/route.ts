import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeBody } from '@/lib/api/safeBody';

export async function POST(request: Request) {
  try {
    const body = await safeBody<{ productIds?: Array<number | string> }>(
      request,
      'ADMIN TOGGLE STOCK VALIDATE API',
    );
    if (body instanceof NextResponse) {
      return body;
    }
    const { productIds } = body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Некорректный список товаров' }, { status: 400 });
    }

    const products = await prisma.products.findMany({
      where: { id: { in: productIds.map(Number) } },
      select: { id: true },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error validating products:', error);
    return NextResponse.json({ success: false, error: 'Ошибка проверки товаров' }, { status: 500 });
  }
}
