import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // никакого ISR/SSG
export const revalidate = 0;            // на всякий случай

export async function GET() {
  try {
    const data = await prisma.site_pages.findMany({
      select: { label: true, href: true },
      orderBy: { order_index: 'asc' },
    });

    const res = NextResponse.json(data, { status: 200 });
    // запретить кеш у браузера и CDN
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.headers.set('CDN-Cache-Control', 'no-store');
    res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: 'Ошибка получения страниц' }, { status: 500 });
  }
}
