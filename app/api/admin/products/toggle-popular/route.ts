import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  const { id } = await req.json();

  const product = await prisma.products.findUnique({
    where: { id: Number(id) },
    select: { id: true, is_popular: true },
  });

  if (!product) {
    return NextResponse.json({ error: 'Товар не найден' }, { status: 500 });
  }

  const updated = await prisma.products.update({
    where: { id: Number(id) },
    data: { is_popular: !product.is_popular },
    select: { id: true, is_popular: true },
  });

  revalidateTag('products');

  return NextResponse.json({ success: true, product: updated });
}
