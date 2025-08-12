// app/sitemap-static.xml/route.ts
import { NextResponse } from 'next/server';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://keytoheart.ru';
export const revalidate = 3600;

export async function GET() {
  const now = new Date().toISOString();

  const paths = [
    '', 'about', 'contacts', 'dostavka', 'payment', 'faq', 'loyalty',
    'occasions', 'catalog', 'cookie-policy', 'policy', 'offer', 'terms',
  ];

  const urls = paths.map((p) => ({
    loc: `${BASE}/${p}`,
    lastmod: now,
    changefreq: 'weekly',
    priority: p === '' ? '1.0' : '0.6',
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
