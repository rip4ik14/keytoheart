/* ------------------------------------------------------------------------- */
/*  Dynamic sitemap.xml – категории + товары + статика (Next 15 App Router)  */
/*  2025‑07‑24 – без обращений к updated_at / created_at                      */
/* ------------------------------------------------------------------------- */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

export const revalidate = 3600;           // 1 час CDN‑кэш

const BASE = 'https://keytoheart.ru';

/* ---------- helpers ---------- */
const tag = (loc: string) => `
  <url>
    <loc>${loc}</loc>
  </url>`;

/* ---------- GET /sitemap.xml ---------- */
export async function GET(_req: NextRequest) {
  /* Supabase anon‑client */
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  /* 1. Статика */
  const pages = [
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
  ].map((p) => tag(`${BASE}${p}`));

  /* 2. Категории */
  const { data: cat } = await supabase
    .from('categories')
    .select('slug')            // ← только существующие поля
    .eq('is_visible', true);

  const cats = (cat ?? []).map((c) => tag(`${BASE}/category/${c.slug}`));

  /* 3. Товары */
  const { data: pr } = await supabase
    .from('products')
    .select('id')              // ← только существующие поля
    .eq('is_visible', true)
    .eq('in_stock', true);

  const prods = (pr ?? []).map((p) => tag(`${BASE}/product/${p.id}`));

  /* 4. XML */
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pages, ...cats, ...prods].join('')}
</urlset>`.trim();

  return new NextResponse(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
