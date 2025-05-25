import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { revalidateTag } from 'next/cache';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { id } = await req.json();

  // 1. Получаем текущий товар
  const product = await prisma.products.findUnique({
    where: { id: Number(id) },
    select: { id: true, in_stock: true },
  });

  if (!product) {
    return NextResponse.json({ error: 'Товар не найден' }, { status: 500 });
  }

  // 2. Инвертируем in_stock
  const newStatus = !product.in_stock;

  // 3. Обновляем статус
  const updated = await prisma.products.update({
    where: { id: Number(id) },
    data: { in_stock: newStatus },
    select: { id: true, in_stock: true },
  });

  // 4. Инвалидируем кэш для товаров
  revalidateTag('products');

  return NextResponse.json({ success: true, product: updated });
}
