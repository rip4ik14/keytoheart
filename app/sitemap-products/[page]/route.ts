// app/sitemap-products/[page]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // anon-достаточно для select
  );

  const { data: products, error } = await supabase
    .from('products')
    .select('id, created_at, images')
    .eq('is_visible', true)
    .eq('in_stock', true)
    .order('id', { ascending: false })
    .range(from, to);

  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://keytoheart.ru';

  if (error || !products?.length) {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>`;
    return new NextResponse(emptyXml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${products
  .map((p) => {
    const lastmod = new Date(p.created_at ?? Date.now()).toISOString();
    const img = Array.isArray(p.images) && p.images[0]
      ? `<image:image><image:loc>${p.images[0]}</image:loc></image:image>`
      : '';
    return `  <url>
    <loc>${BASE}/product/${p.id}</loc>
    <lastmod>${lastmod}</lastmod>
    ${img}
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
