// app/sitemap-products/[page].xml/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://keytoheart.ru';
const PAGE_SIZE = 10000;

// ВАЖНО: запрещаем статический пререндер — всегда динамика на рантайме
export const dynamic = 'force-dynamic';
export const revalidate = 0; // не просим ISR у Next, сами отдадим кэш-заголовки

function xmlEscape(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function GET(
  _req: Request,
  { params }: { params?: { page?: string } }
) {
  // Защита от вызова без параметра
  const pageNum = Number(params?.page || 1);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  try {
    // Не запрашиваем updated_at (его нет в схемe) — используем created_at
    const { data } = await supabase
      .from('products')
      .select('id, images, created_at, is_visible, in_stock')
      .eq('is_visible', true)
      .eq('in_stock', true)
      .order('id', { ascending: true })
      .range(from, to);

    const rows = (data ?? []).map((p) => {
      const url = `${BASE}/product/${p.id}`;
      const last = p.created_at ? new Date(p.created_at as any).toISOString() : new Date().toISOString();
      const imgs: string[] = Array.isArray(p.images) ? (p.images as string[]).slice(0, 2) : [];
      const imgXml = imgs
        .map(
          (src) => `    <image:image>
      <image:loc>${xmlEscape(src)}</image:loc>
    </image:image>`,
        )
        .join('\n');

      return `  <url>
    <loc>${url}</loc>
    <lastmod>${last}</lastmod>
${imgXml}
  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${rows.join('\n')}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (e) {
    // В случае ошибки — отдаём пустую валидную карту, чтобы не ломать обход
    const empty = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`;
    return new NextResponse(empty, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  }
}
