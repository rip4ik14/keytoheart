import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.categories.findMany({
      where: { is_visible: true },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        subcategories: {
          where: { is_visible: true },
          select: { id: true, name: true, slug: true, category_id: true },
        },
      },
    });
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch categories: ' + error.message },
      { status: 500 },
    );
  }
}
