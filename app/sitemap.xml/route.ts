// app/sitemap.xml/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://keytoheart.ru';
const PAGE_SIZE = 10000; // товаров на один файл карты

export const revalidate = 3600;

export async function GET() {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Считаем кол-во товаров (видимых и в наличии) для пагинации
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_visible', true)
      .eq('in_stock', true);

    const total = count ?? 0;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const now = new Date().toISOString();

    const urls: string[] = [
      `${BASE}/sitemap-static.xml`,
      `${BASE}/sitemap-categories.xml`,
      ...Array.from({ length: pages }).map((_, i) => `${BASE}/sitemap-products/${i + 1}.xml`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <sitemap>
    <loc>${u}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
  )
  .join('\n')}
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (e) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>`;
    return new NextResponse(xml, { status: 200, headers: { 'content-type': 'application/xml; charset=utf-8' } });
  }
}
