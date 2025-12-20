import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://keytoheart.ru';

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
  const limit = 5000;
  const from = (pageNumber - 1) * limit;
  const to = from + limit - 1;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, created_at, updated_at, images')
    .eq('is_visible', true)
    .eq('in_stock', true)
    .order('id', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[sitemap-products] supabase error:', error);
    return NextResponse.json(
      { error: 'Supabase error', details: error },
      { status: 500 }
    );
  }

  if (!products || products.length === 0) {
    return new NextResponse(emptyXml(), {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }

  const urls = products
    .map((p) => {
      const lastmod = new Date(
        p.updated_at ?? p.created_at ?? Date.now()
      ).toISOString();

      const loc = `${BASE}/product/${p.id}`;

      const images = Array.isArray(p.images)
        ? p.images.slice(0, 10).map(
            (img) => `
    <image:image>
      <image:loc>${esc(img)}</image:loc>
      <image:title>${esc(p.title)}</image:title>
      <image:caption>${esc(p.title)}</image:caption>
    </image:image>`
          ).join('')
        : '';

      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>${images}
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
