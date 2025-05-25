import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const subcategoryParam = searchParams.get('subcategory');
  const subcategoriesParam = searchParams.get('subcategories');

  if (!category) {
    return NextResponse.json(
      { success: false, error: 'Отсутствует параметр category' },
      { status: 400 }
    );
  }

  let subcategories: string[] = [];
  if (subcategoriesParam) {
    subcategories = subcategoriesParam.split(',');
  } else if (subcategoryParam) {
    subcategories = [subcategoryParam];
  } else {
    return NextResponse.json(
      { success: false, error: 'Отсутствует параметр subcategory или subcategories' },
      { status: 400 }
    );
  }

  try {
    // Если у тебя поле category строка, фильтруем по ним
    const items = await prisma.upsell_items.findMany({
      where: { category: { in: subcategories } },
      select: {
        id: true,
        title: true,
        price: true,
        image_url: true,
        category: true,
      },
    });

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: true, data: [] },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' } }
      );
    }

    // id в строку, image_url гарантируем не null
    const formattedItems = items.map((item: { id: number | string, title: string, price: number, image_url?: string, category: string }) => ({
  id: item.id.toString(),
  title: item.title,
  price: item.price,
  image_url: item.image_url || '',
  category: item.category,
}));


    return NextResponse.json(
      { success: true, data: formattedItems },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Неожиданная ошибка сервера', details: err.message },
      { status: 500 }
    );
  }
}

export const revalidate = 3600;
