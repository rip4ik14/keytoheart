// app/sitemap.xml/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

export const runtime = 'nodejs';      // не edge
export const revalidate = 3600;       // 1 час

const BASE = 'https://keytoheart.ru';
const tag = (loc: string) => `<url><loc>${loc}</loc></url>`;

const STATIC_PAGES = [
  '/',
  '/about',
  '/contacts',
  '/dostavka',
  '/payment',
  '/faq',
  '/loyalty',
  '/occasions',
  '/catalog',
  '/cookie-policy',
  '/policy',
  '/offer',
  '/terms',
];

// Минимально необходимые типы
type CategorySlug = { slug: string };
type ProductId = { id: string };

// PromiseLike-safe таймаут
function withTimeout<T>(p: PromiseLike<T>, ms = 3000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

export async function GET() {
  const pages = STATIC_PAGES.map((p) => tag(`${BASE}${p}`));

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Если ENV нет — отдаем только статику
  if (!supaUrl || !supaKey) {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.join('')}
</urlset>`.trim();

    console.error('Sitemap: Supabase ENV missing, serving static only');
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=300',
      },
    });
  }

  const supabase = createClient<Database>(supaUrl, supaKey);

  let catsXml = '';
  let prodsXml = '';

  try {
    const catRes = await withTimeout(
      supabase
        .from('categories')
        .select('slug')
        .eq('is_visible', true) as unknown as PromiseLike<{ data: CategorySlug[] | null }>,
      3000
    );
    catsXml = (catRes.data ?? [])
      .map((c: CategorySlug) => tag(`${BASE}/category/${c.slug}`))
      .join('');
  } catch (e) {
    console.error('Sitemap categories error:', e);
  }

  try {
    const prodRes = await withTimeout(
      supabase
        .from('products')
        .select('id')
        .eq('is_visible', true)
        .eq('in_stock', true) as unknown as PromiseLike<{ data: ProductId[] | null }>,
      3000
    );
    prodsXml = (prodRes.data ?? [])
      .map((p: ProductId) => tag(`${BASE}/product/${p.id}`))
      .join('');
  } catch (e) {
    console.error('Sitemap products error:', e);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.join('')}${catsXml}${prodsXml}
</urlset>`.trim();

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=300',
    },
  });
}
