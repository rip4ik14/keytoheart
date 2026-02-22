// lib/data/home.ts
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js'; // ← изменили импорт
import type { Database } from '@/lib/supabase/types_new';

const REQUEST_TIMEOUT = 8000;

async function withTimeout<T>(
  promise: Promise<T> | PromiseLike<T>,
  timeoutMs = REQUEST_TIMEOUT,
): Promise<T> {
  const wrapped = Promise.resolve(promise);
  return Promise.race([
    wrapped,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timed out')), timeoutMs),
    ),
  ]);
}

export type Product = {
  id: number;
  title: string;
  price: number;
  discount_percent: number | null;
  in_stock: boolean;
  images: string[];
  production_time?: number | null;
  is_popular?: boolean | null;
  category_ids: number[];
};

export type CategoryMeta = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

export type GiftIdeaItem = {
  id: number;
  name: string;
  slug: string;
  home_icon_url?: string | null;
  home_title?: string | null;
};

// ✅ Теперь полностью статично — можно кэшировать
export const getHomeData = unstable_cache(
  async () => {
    // Публичный клиент (без cookies) — идеально для главной
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Параллельные запросы
    const [povodRes, pcRes, prRes, catRes] = await Promise.all([
      withTimeout(
        supabase.from('categories').select('id,slug').eq('slug', 'povod').maybeSingle(),
      ),
      withTimeout(supabase.from('product_categories').select('product_id, category_id')),
      withTimeout(
        supabase
          .from('products')
          .select('id,title,price,discount_percent,in_stock,images,production_time,is_popular')
          .eq('in_stock', true)
          .not('images', 'is', null)
          .order('is_popular', { ascending: false })
          .order('id', { ascending: false })
          .limit(120),
      ),
      withTimeout(supabase.from('categories').select('id,name,slug')),
    ]);

    // Gift Ideas
    let giftIdeas: GiftIdeaItem[] = [];
    if (povodRes.data?.id) {
      const { data } = await withTimeout(
        supabase
          .from('subcategories')
          .select('id,name,slug,home_icon_url,home_title,home_sort,is_visible,home_is_featured,category_id')
          .eq('category_id', povodRes.data.id)
          .eq('home_is_featured', true)
          .eq('is_visible', true)
          .order('home_sort', { ascending: true })
          .limit(24),
      );
      giftIdeas = (data ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        home_icon_url: s.home_icon_url ?? null,
        home_title: s.home_title ?? null,
      }));
    }

    const pcSafe = pcRes.data ?? [];
    const prSafe = prRes.data ?? [];
    const catSafe = catRes.data ?? [];

    const pcMap = new Map<number, number[]>();
    pcSafe.forEach(({ product_id, category_id }) => {
      const arr = pcMap.get(product_id) || [];
      pcMap.set(product_id, [...arr, category_id]);
    });

    const products: Product[] = prSafe.map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      discount_percent: p.discount_percent ?? null,
      in_stock: p.in_stock ?? false,
      images: p.images ?? [],
      production_time: p.production_time ?? null,
      is_popular: p.is_popular ?? null,
      category_ids: pcMap.get(p.id) || [],
    }));

    const catMap = new Map(catSafe.map((c: any) => [c.id, { name: c.name, slug: c.slug }]));

    const IGNORE_SLUGS = new Set(['podarki', 'myagkie-igrushki', 'vazy', 'cards', 'balloons']);
    const PRIORITY_SLUGS = ['klubnika-v-shokolade', 'flowers', 'combo'];
    const MIN_PRODUCTS_PER_CATEGORY = 2;

    const categoryCounts = new Map<number, number>();
    products.forEach((p) => {
      p.category_ids.forEach((id) => {
        const slug = catMap.get(id)?.slug;
        if (!slug || IGNORE_SLUGS.has(slug)) return;
        categoryCounts.set(id, (categoryCounts.get(id) ?? 0) + 1);
      });
    });

    let categoryMetaAll: CategoryMeta[] = [...categoryCounts.entries()]
      .map(([id, count]) => {
        const catEntry = catMap.get(id);
        if (!catEntry) return null;
        return { id, name: catEntry.name, slug: catEntry.slug, count };
      })
      .filter((c): c is CategoryMeta => !!c && c.count >= MIN_PRODUCTS_PER_CATEGORY);

    categoryMetaAll.sort((a, b) => {
      const ai = PRIORITY_SLUGS.indexOf(a.slug);
      const bi = PRIORITY_SLUGS.indexOf(b.slug);
      const aPriority = ai === -1 ? Infinity : ai;
      const bPriority = bi === -1 ? Infinity : bi;

      if (aPriority !== bPriority) return aPriority - bPriority;
      if (aPriority === Infinity && bPriority === Infinity) {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name, 'ru');
      }
      return 0;
    });

    return {
      products,
      categoriesMeta: categoryMetaAll,
      giftIdeas,
    };
  },
  ['home-page-data'],
  { revalidate: 300, tags: ['home'] },
);