import { Metadata } from 'next';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import CatalogClient, {
  Product,
  SitePage,
  CategoryFromDB,
  SubcategoryFromDB,
} from '@components/CatalogClient';

const REQUEST_TIMEOUT = 8000;

async function withTimeout<T = any>(
  promise: Promise<T> | PromiseLike<T>,
  timeoutMs = REQUEST_TIMEOUT,
): Promise<T> {
  const wrappedPromise = Promise.resolve(promise);

  return Promise.race<T>([
    wrappedPromise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timed out fetching data')), timeoutMs),
    ),
  ]);
}

/* ------------------------------------------------------------------ */
/*                              SEO meta                              */
/* ------------------------------------------------------------------ */
export const metadata: Metadata = {
  title:       'Каталог: клубника в шоколаде, букеты и цветы',
  description:
    'Клубника в шоколаде, клубничные букеты и цветы с доставкой по Краснодару и до 20 км. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой.',
  keywords: [
    'клубника в шоколаде',
    'клубничные букеты Краснодар',
    'купить клубнику в шоколаде',
    'доставка цветов Краснодар',
    'букеты 30 минут',
    'подарки из клубники',
  ],
  openGraph: {
    title:       'Каталог подарков: клубника в шоколаде и цветы | КЛЮЧ К СЕРДЦУ',
    description:
      'Выберите свежую клубнику в шоколаде, букеты и комбо‑наборы с быстрой доставкой по Краснодару.',
    url:         'https://keytoheart.ru/catalog',
    images: [{ url: 'https://keytoheart.ru/og-cover.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Каталог KEY TO HEART ― клубника в шоколаде и букеты',
    description:
      'Свежая клубника в шоколаде и цветы с доставкой 60 мин по Краснодару.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru/catalog' },
};

/* ------------------------------------------------------------------ */
/*                           data helpers                             */
/* ------------------------------------------------------------------ */
const fetchSitePages = async (): Promise<SitePage[]> => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('site_pages').select('label, href').order('order_index'),
    );
    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    process.env.NODE_ENV !== 'production' &&
      console.warn('[catalog] site_pages fetch failed →', error);
    return [];
  }
};

const fetchCategories = async (): Promise<CategoryFromDB[]> => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('categories').select('id, name, slug, is_visible'),
    );
    if (error) throw new Error(error.message);
    return (data || []).map((c) => ({ ...c, is_visible: c.is_visible ?? true }));
  } catch (error) {
    process.env.NODE_ENV !== 'production' &&
      console.warn('[catalog] categories fetch failed →', error);
    return [];
  }
};

const fetchSubcategories = async (): Promise<SubcategoryFromDB[]> => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('subcategories').select('id, name, slug, is_visible'),
    );
    if (error) throw new Error(error.message);
    return (data || []).map((s) => ({ ...s, is_visible: s.is_visible ?? true }));
  } catch (error) {
    process.env.NODE_ENV !== 'production' &&
      console.warn('[catalog] subcategories fetch failed →', error);
    return [];
  }
};

const fetchProducts = async (): Promise<Product[]> => {
  try {
    /* --- связи товаров ↔ категории --- */
    const { data: pc, error: pcErr } = await withTimeout(
      supabase.from('product_categories').select('product_id, category_id'),
    );
    if (pcErr) throw new Error(pcErr.message);

    const pcMap = new Map<number, number[]>();
    pc.forEach((row) =>
      pcMap.set(row.product_id, [...(pcMap.get(row.product_id) || []), row.category_id]),
    );

    /* --- связи товаров ↔ подкатегории --- */
    const { data: ps, error: psErr } = await withTimeout(
      supabase.from('product_subcategories').select('product_id, subcategory_id'),
    );
    if (psErr) throw new Error(psErr.message);

    const psMap = new Map<number, number[]>();
    ps.forEach((row) =>
      psMap.set(row.product_id, [...(psMap.get(row.product_id) || []), row.subcategory_id]),
    );

    /* --- имена подкатегорий --- */
    const allSubIds = Array.from(new Set(ps.map((p) => p.subcategory_id)));
    const { data: subs, error: subsErr } = await withTimeout(
      supabase
        .from('subcategories')
        .select('id, name')
        .in('id', allSubIds.length ? allSubIds : [0]),
    );
    if (subsErr) throw new Error(subsErr.message);
    const subNameMap = new Map<number, string>();
    subs.forEach((s) => subNameMap.set(s.id, s.name));

    /* --- сами продукты --- */
    const { data: pr, error: prErr } = await withTimeout(
      supabase
        .from('products')
        .select(
          `id,title,price,original_price,discount_percent,images,image_url,created_at,slug,
       bonus,short_desc,description,composition,is_popular,is_visible,production_time,in_stock`,
        )
        .order('id', { ascending: true }),
    );
    if (prErr) throw new Error(prErr.message);

    return (pr || []).map((p) => ({
      id: p.id,
      title: p.title || 'Без названия',
      price: p.price || 0,
      original_price: p.original_price ?? p.price,
      discount_percent: p.discount_percent ?? 0,
      images: Array.isArray(p.images) ? p.images : [],
      image_url: p.image_url ?? null,
      created_at: p.created_at ?? null,
      slug: p.slug ?? null,
      bonus: p.bonus ?? null,
      short_desc: p.short_desc ?? null,
      description: p.description ?? null,
      composition: p.composition ?? null,
      is_popular: p.is_popular ?? null,
      is_visible: p.is_visible ?? null,
      production_time: p.production_time ?? null,
      in_stock: p.in_stock ?? null,
      category_ids: pcMap.get(p.id) || [],
      subcategory_ids: psMap.get(p.id) || [],
      subcategory_names: (psMap.get(p.id) || []).map((id) => subNameMap.get(id) || ''),
    }));
  } catch (error) {
    process.env.NODE_ENV !== 'production' &&
      console.warn('[catalog] products fetch failed →', error);
    return [];
  }
};

/* ------------------------------------------------------------------ */
/*                               PAGE                                 */
/* ------------------------------------------------------------------ */
export default async function CatalogPage() {
  const [products, sitePages, subcategoriesDB, categoriesDB] = await Promise.all([
    fetchProducts(),
    fetchSitePages(),
    fetchSubcategories(),
    fetchCategories(),
  ]);

  return (
    <CatalogClient
      initialProducts={products}
      initialSitePages={sitePages}
      initialSubcategoriesDB={subcategoriesDB}
      categoriesDB={categoriesDB}
    />
  );
}
