import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const data = await prisma.site_pages.findMany({
      select: { label: true, href: true },
      orderBy: { order_index: 'asc' },
    });
    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Ошибка получения страниц' }, { status: 400 });
  }
}

export const revalidate = 3600;
