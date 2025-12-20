// ✅ Путь: app/sitemap-categories.xml/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://keytoheart.ru';
export const revalidate = 3600;

export async function GET() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const now = new Date().toISOString();

  const { data: cats } = await supabase
    .from('categories')
    .select('id,slug,is_visible')
    .eq('is_visible', true);

  // подтягиваем подкатегории
  const catIds = (cats ?? []).map((c) => c.id);
  const { data: subs } = catIds.length
    ? await supabase
        .from('subcategories')
        .select('id,slug,category_id,is_visible')
        .in('category_id', catIds)
        .eq('is_visible', true)
    : { data: [] as any[] };

  // Поводы - как было
  const occasions = [
    '8marta','happybirthday','love','newyear','23february','valentinesday',
    'man','mame','mothersday','graduation','anniversary','family_day',
    'child_birthday','last_bell','work','1september',
  ];

  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    // категории
    ...(cats ?? []).map((c) => ({
      loc: `${BASE}/category/${c.slug}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.7',
    })),

    // подкатегории
    ...(subs ?? []).map((s) => {
      const parent = (cats ?? []).find((c) => c.id === s.category_id);
      if (!parent?.slug || !s.slug) return null;

      return {
        loc: `${BASE}/category/${parent.slug}/${s.slug}`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.65',
      };
    }).filter(Boolean) as any[],

    // occasions
    ...occasions.map((s) => ({
      loc: `${BASE}/occasions/${s}`,
      lastmod: now,
      changefreq: 'monthly',
      priority: '0.55',
    })),
  ];

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
