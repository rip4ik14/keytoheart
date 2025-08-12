// app/sitemap-products/[page]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://keytoheart.ru';

function esc(s: string) {
  return String(s ?? '').replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string)
  );
}

export async function GET(
  _req: Request,
  { params }: { params: { page?: string } }
) {
  const pageNumber = Math.max(1, Number(params?.page || 1));
  const limit = 5000;
  const from = (pageNumber - 1) * limit;
  const to = from + limit - 1;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, updated_at, created_at, images, is_visible, in_stock')
    .eq('is_visible', true)
    .eq('in_stock', true)
    .order('id', { ascending: false })
    .range(from, to);

  if (error || !products?.length) {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>`;
    return new NextResponse(emptyXml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }

  const urlsXml = products.map((p) => {
    const lastmodISO = new Date(p.updated_at ?? p.created_at ?? Date.now()).toISOString();

    // остаёмся на текущей схеме URL без ЧПУ
    const loc = `${BASE}/product/${p.id}`;

    const imgs: string[] = Array.isArray(p.images) ? p.images : [];
    const imagesXml = imgs.slice(0, 10).map((img) => `
  <image:image>
    <image:loc>${esc(img)}</image:loc>
    <image:title>${esc(p.title || '')}</image:title>
    <image:caption>${esc(p.title || '')}</image:caption>
  </image:image>`).join('');

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmodISO}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>${imagesXml}
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
