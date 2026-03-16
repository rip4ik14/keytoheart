// ✅ Путь: lib/data/home.ts
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const REQUEST_TIMEOUT = 4000;

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
  og_image: string | null;
};

export type HomePillItem = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  home_title: string | null;
  type: 'category' | 'subcategory';
  category_slug?: string;
  sort: number;
};

type CategoryPillRow = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  home_title: string | null;
  type: 'category';
  sort: number;
};

type SubcategoryPillRow = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  home_title: string | null;
  type: 'subcategory';
  category_slug: string;
  sort: number;
};

function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}

export const getHomeData = unstable_cache(
  async () => {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const [pcRes, prRes, catRes, featuredCatsRes, featuredSubsRes] = await Promise.all([
      withTimeout(supabase.from('product_categories').select('product_id, category_id')),
      withTimeout(
        supabase
          .from('products')
          .select('id,title,price,discount_percent,in_stock,images,production_time,is_popular')
          .eq('in_stock', true)
          .not('images', 'is', null)
          .order('is_popular', { ascending: false })
          .order('id', { ascending: false })
          .limit(48),
      ),
      withTimeout(supabase.from('categories').select('id,name,slug,og_image,is_visible')),
      withTimeout(
        supabase
          .from('categories')
          .select('id,name,slug,og_image,home_title,home_sort,is_visible,home_is_featured')
          .eq('is_visible', true)
          .eq('home_is_featured', true)
          .order('home_sort', { ascending: true })
          .order('id', { ascending: true })
          .limit(20),
      ),
      withTimeout(
        supabase
          .from('subcategories')
          .select(
            'id,name,slug,category_id,image_url,home_icon_url,home_title,home_sort,is_visible,home_is_featured',
          )
          .eq('is_visible', true)
          .eq('home_is_featured', true)
          .order('home_sort', { ascending: true })
          .order('id', { ascending: true })
          .limit(20),
      ),
    ]);

    const pcSafe = pcRes.data ?? [];
    const prSafe = prRes.data ?? [];
    const catSafe = (catRes.data ?? []) as any[];
    const featuredCats = (featuredCatsRes.data ?? []) as any[];
    const featuredSubs = (featuredSubsRes.data ?? []) as any[];

    const pcMap = new Map<number, number[]>();
    pcSafe.forEach(({ product_id, category_id }) => {
      const arr = pcMap.get(Number(product_id)) || [];
      arr.push(Number(category_id));
      pcMap.set(Number(product_id), arr);
    });

    const products: Product[] = prSafe.map((p: any) => ({
      id: Number(p.id),
      title: String(p.title ?? ''),
      price: Number(p.price ?? 0),
      discount_percent: p.discount_percent ?? null,
      in_stock: !!p.in_stock,
      images: Array.isArray(p.images) ? p.images : [],
      production_time: p.production_time ?? null,
      is_popular: p.is_popular ?? null,
      category_ids: pcMap.get(Number(p.id)) || [],
    }));

    const catMap = new Map<
      number,
      {
        name: string;
        slug: string;
        og_image: string | null;
        is_visible: boolean;
      }
    >();

    catSafe.forEach((c: any) => {
      catMap.set(Number(c.id), {
        name: String(c.name ?? ''),
        slug: String(c.slug ?? ''),
        og_image: c.og_image ?? null,
        is_visible: c.is_visible !== false,
      });
    });

    const IGNORE_SLUGS = new Set(['podarki', 'myagkie-igrushki', 'vazy', 'cards', 'balloons']);
    const PRIORITY_SLUGS = ['klubnika-v-shokolade', 'flowers', 'combo'];
    const MIN_PRODUCTS_PER_CATEGORY = 2;

    const categoryCounts = new Map<number, number>();
    products.forEach((p) => {
      p.category_ids.forEach((id) => {
        const cat = catMap.get(id);
        const slug = cat?.slug;
        if (!cat || !slug || IGNORE_SLUGS.has(slug) || cat.is_visible === false) return;
        categoryCounts.set(id, (categoryCounts.get(id) ?? 0) + 1);
      });
    });

    const categoryMetaAll: CategoryMeta[] = [...categoryCounts.entries()]
      .map(([id, count]) => {
        const catEntry = catMap.get(id);
        if (!catEntry) return null;

        const item: CategoryMeta = {
          id,
          name: catEntry.name,
          slug: catEntry.slug,
          count,
          og_image: catEntry.og_image ?? null,
        };

        return item;
      })
      .filter(isNonNull)
      .filter((item) => item.count >= MIN_PRODUCTS_PER_CATEGORY);

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

    const visibleCategoryIds = new Set(categoryMetaAll.map((c) => c.id));

    const categoryPills: CategoryPillRow[] = featuredCats
      .map((c) => ({
        id: Number(c.id),
        name: String(c.name ?? ''),
        slug: String(c.slug ?? ''),
        image: c.og_image ?? null,
        home_title: c.home_title ?? null,
        type: 'category' as const,
        sort: Number(c.home_sort ?? 0),
      }))
      .filter((c) => visibleCategoryIds.has(c.id));

    const subcategoryPills: SubcategoryPillRow[] = featuredSubs
      .map((s): SubcategoryPillRow | null => {
        const parent = catMap.get(Number(s.category_id));
        if (!parent || !parent.slug) return null;

        return {
          id: Number(s.id),
          name: String(s.name ?? ''),
          slug: String(s.slug ?? ''),
          image: s.home_icon_url ?? s.image_url ?? null,
          home_title: s.home_title ?? null,
          type: 'subcategory',
          category_slug: parent.slug,
          sort: Number(s.home_sort ?? 0),
        };
      })
      .filter(isNonNull);

    let homePillItems: HomePillItem[] = [...categoryPills, ...subcategoryPills]
      .sort((a, b) => {
        if (a.sort !== b.sort) return a.sort - b.sort;
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.id - b.id;
      })
      .slice(0, 7);

    if (homePillItems.length === 0) {
      homePillItems = categoryMetaAll.slice(0, 7).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.og_image ?? null,
        home_title: null,
        type: 'category' as const,
        sort: 0,
      }));
    }

    return {
      products,
      categoriesMeta: categoryMetaAll,
      homePillItems,
    };
  },
  ['home-page-data'],
  { revalidate: 300, tags: ['home'] },
);
