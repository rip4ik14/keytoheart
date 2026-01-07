import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { safeBody } from '@/lib/api/safeBody';
import { requireCsrf } from '@/lib/api/csrf';


export async function POST(req: NextRequest) {
  const csrfError = requireCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  const body = await safeBody<{ id?: number | string }>(req, 'ADMIN TOGGLE STOCK API');
  if (body instanceof NextResponse) {
    return body;
  }
  const { id } = body;

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
