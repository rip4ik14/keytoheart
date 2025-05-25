import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Product {
  id: number;
  title: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  in_stock: boolean | null;
  images: string[];
  is_popular: boolean | null;
  is_visible: boolean | null;
  order_index: number | null;
}

export async function GET() {
  try {
    const data = await prisma.products.findMany({
      where: {
        in_stock: true,
        is_popular: true,
        is_visible: true,
      },
      select: {
        id: true,
        title: true,
        price: true,
        original_price: true,
        discount_percent: true,
        in_stock: true,
        images: true,
        is_popular: true,
        is_visible: true,
        order_index: true,
      },
      orderBy: {
        order_index: 'asc',
      },
      take: 10,
    });

    const formattedData = data.map((product: Product) => ({
      ...product,
      images: Array.isArray(product.images) && product.images.length > 0 ? [product.images[0]] : [],
    }));

    return NextResponse.json(formattedData, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Неожиданная ошибка сервера', details: err.message || 'Нет деталей' },
      { status: 500 }
    );
  }
}

export const revalidate = 60;
