import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Итоговый тип, который мы возвращаем на фронт (для автокомплита)
interface PopularProduct {
  id: number;
  title: string;
  price: number | null;
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
    // Получаем товары из базы
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

    // Приводим все поля к правильным типам
    const formattedData: PopularProduct[] = data.map((product: any) => ({
      id: product.id,
      title: product.title,
      price: product.price !== null ? Number(product.price) : null,
      original_price: product.original_price !== null ? Number(product.original_price) : null,
      discount_percent: product.discount_percent !== null ? Number(product.discount_percent) : null,
      in_stock: product.in_stock,
      images: Array.isArray(product.images)
        ? (product.images.length > 0 ? [product.images[0]] : [])
        : [],
      is_popular: product.is_popular,
      is_visible: product.is_visible,
      order_index: product.order_index !== null ? Number(product.order_index) : null,
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
