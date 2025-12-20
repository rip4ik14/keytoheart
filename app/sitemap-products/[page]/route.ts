// ✅ Путь: app/sitemap-products/[page]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://keytoheart.ru';

// ДОЛЖНО совпадать с PAGE_SIZE в app/sitemap.xml/route.ts
const PAGE_SIZE = 10000;

function esc(s: string) {
  return String(s ?? '').replace(/[<>&'"]/g, (c) =>
    ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    }[c] as string)
  );
}

function emptyXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>`;
}

export async function GET(
  _req: Request,
  { params }: { params: { page?: string } }
) {
  const pageNumber = Math.max(1, Number(params?.page || 1));
  const from = (pageNumber - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, created_at, images')
    .eq('is_visible', true)
    .eq('in_stock', true)
    .order('id', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[sitemap-products] supabase error:', error);
    return NextResponse.json(
      { error: 'Supabase error in sitemap-products', details: error },
      { status: 500 }
    );
  }

  if (!products || products.length === 0) {
    return new NextResponse(emptyXml(), {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  const urlsXml = products
    .map((p: any) => {
      const lastmodISO = new Date(p.created_at ?? Date.now()).toISOString();
      const loc = `${BASE}/product/${p.id}`;

      const imgs: string[] = Array.isArray(p.images) ? p.images : [];
      const imagesXml = imgs
        .slice(0, 10)
        .map(
          (img) => `
  <image:image>
    <image:loc>${esc(img)}</image:loc>
    <image:title>${esc(p.title || '')}</image:title>
    <image:caption>${esc(p.title || '')}</image:caption>
  </image:image>`
        )
        .join('');

      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmodISO}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>${imagesXml}
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
