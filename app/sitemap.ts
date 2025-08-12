// app/sitemap.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

export default async function sitemap() {
  const base = 'https://keytoheart.ru';

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const now = new Date();

  // Статические страницы
  const staticPages = [
    { path: '',                 priority: 1.0, freq: 'daily'   },
    { path: 'about',            priority: 0.6, freq: 'monthly' },
    { path: 'contacts',         priority: 0.6, freq: 'monthly' },
    { path: 'dostavka',         priority: 0.7, freq: 'monthly' },
    { path: 'payment',          priority: 0.6, freq: 'monthly' },
    { path: 'faq',              priority: 0.5, freq: 'monthly' },
    { path: 'loyalty',          priority: 0.5, freq: 'monthly' },
    { path: 'catalog',          priority: 0.6, freq: 'weekly'  },
    { path: 'cookie-policy',    priority: 0.2, freq: 'yearly'  },
    { path: 'policy',           priority: 0.2, freq: 'yearly'  },
    { path: 'offer',            priority: 0.2, freq: 'yearly'  },
    { path: 'terms',            priority: 0.2, freq: 'yearly'  },
    { path: 'occasions',        priority: 0.5, freq: 'monthly' },
  ];

  const staticPaths = staticPages.map(({ path, priority, freq }) => ({
    url: `${base}/${path}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }));

  // Поводы (из /occasions/[slug])
  const occasionSlugs = [
    '8marta','happybirthday','love','newyear','23february','valentinesday',
    'man','mame','mothersday','graduation','anniversary','family_day',
    'child_birthday','last_bell','work','1september',
  ];
  const occasionUrls = occasionSlugs.map((slug) => ({
    url: `${base}/occasions/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.55,
  }));

  // Категории из БД
  const { data: cats } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_visible', true);

  const catUrls = (cats ?? []).map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Товары в наличии
  const { data: prods } = await supabase
    .from('products')
    .select('id')
    .eq('is_visible', true)
    .eq('in_stock', true);

  const prodUrls = (prods ?? []).map((p) => ({
    url: `${base}/product/${p.id}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticPaths, ...occasionUrls, ...catUrls, ...prodUrls];
}
