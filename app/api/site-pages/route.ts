import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await prisma.site_pages.findMany({
      select: { label: true, href: true },
      orderBy: { order_index: 'asc' },
    });

    const res = NextResponse.json(data, { status: 200 });
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.headers.set('CDN-Cache-Control', 'no-store');
    res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    return res;
  } catch (err: any) {
    console.error('GET /api/site-pages error:', err);
    return NextResponse.json(
      { error: 'Ошибка получения страниц', details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
