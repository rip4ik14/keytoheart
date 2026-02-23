// ✅ Путь: components/CatalogClient.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import ProductCard from '@components/ProductCard';
import ProductCardSkeleton from '@components/ProductCardSkeleton';
import FilterSection from '@components/FilterSection';
import SortDropdown from '@components/SortDropdown';
import type { Database } from '@/lib/supabase/types_new';

/* ------------------------------------------------------------------ */
/*                               TYPES                                */
/* ------------------------------------------------------------------ */

// ВАЖНО: держим только то, что реально нужно карточке и фильтрации
export interface Product {
  id: number;
  title: string;
  price: number;
  original_price?: number | null;
  discount_percent?: number | null;
  images: string[]; // в идеале 1 картинка
  slug?: string | null;

  bonus?: number | null;
  in_stock?: boolean | null;
  is_visible?: boolean | null;
  production_time?: number | null;

  category_ids: number[];
  subcategory_ids: number[];
}

export type ProductRow = Database['public']['Tables']['products']['Row'];
export type SitePage = { label: string; href: string };
export type SubcategoryFromDB = { id: number; name: string; slug: string; is_visible: boolean };
export type CategoryFromDB = { id: number; name: string; slug: string; is_visible: boolean };

type Category = { label: string; slug: string };
type Subcategory = { label: string; slug: string; id: number };

type CatalogClientProps = {
  initialProducts: Product[];
  initialSitePages: SitePage[];
  initialSubcategoriesDB: SubcategoryFromDB[];
  categoriesDB: CategoryFromDB[];
};

/* ------------------------------------------------------------------ */
/*                              HELPERS                               */
/* ------------------------------------------------------------------ */

function safeNum(v: string | null) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseCsvNums(v: string | null) {
  if (!v) return [];
  return String(v)
    .split(',')
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/* ------------------------------------------------------------------ */
/*                              COMPONENT                             */
/* ------------------------------------------------------------------ */

export default function CatalogClient({
  initialProducts,
  initialSitePages,
  initialSubcategoriesDB,
  categoriesDB,
}: CatalogClientProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  /* ------------------------------ state ----------------------------- */
  const [products] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [sitePages] = useState<SitePage[]>(initialSitePages);
  const [subcategoriesDB] = useState<SubcategoryFromDB[]>(initialSubcategoriesDB);

  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  /* ---------------------- price bounds (realistic) ------------------ */
  const priceBounds = useMemo(() => {
    let max = 0;

    for (const p of products) {
      const effective =
        p.discount_percent && p.discount_percent > 0
          ? Math.round(p.price * (1 - p.discount_percent / 100))
          : p.price;

      if (Number.isFinite(effective)) max = Math.max(max, effective);
    }

    const roundedMax = Math.min(65000, Math.ceil((max || 10000) / 100) * 100);
    return { min: 0, max: roundedMax };
  }, [products]);

  /* ---------------------------- filters ----------------------------- */
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [0, 10000]);
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // slug (desktop)
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | ''>(''); // id (desktop)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // touched flags - чтобы не писать в URL автоматически
  const priceTouchedRef = useRef(false);
  const categoryTouchedRef = useRef(false);
  const subcategoryTouchedRef = useRef(false);

  // актуализируем дефолтный max по реальным товарам (только если пользователь сам не трогал)
  useEffect(() => {
    if (priceTouchedRef.current) return;

    const next: [number, number] = [priceBounds.min, priceBounds.max];
    if (priceRange[0] !== next[0] || priceRange[1] !== next[1]) setPriceRange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceBounds.min, priceBounds.max]);

  /* ---------------- query filters (from modal) ---------------------- */
  const qMin = safeNum(sp.get('min'));
  const qMax = safeNum(sp.get('max'));
  const qCats = parseCsvNums(sp.get('cats'));
  const qSubs = parseCsvNums(sp.get('subs'));

  /* -------- slug → categoryId map (чтобы не искать постоянно) ------- */
  const categorySlugToIdMap = useMemo(() => {
    const m = new Map<string, number>();
    categoriesDB.forEach((c) => m.set(c.slug, c.id));
    return m;
  }, [categoriesDB]);

  const categoryIdToSlugMap = useMemo(() => {
    const m = new Map<number, string>();
    categoriesDB.forEach((c) => m.set(c.id, c.slug));
    return m;
  }, [categoriesDB]);

  /* --------------------- derive categories list --------------------- */
  const categories: Category[] = useMemo(() => {
    return Array.from(
      new Map(
        sitePages
          .filter((p) => {
            const segments = p.href.split('/').filter(Boolean);
            return p.href.startsWith('/category/') && segments.length === 2;
          })
          .map((p) => {
            const slug = p.href.split('/')[2];
            return [slug, { label: p.label, slug }];
          }),
      ).values(),
    );
  }, [sitePages]);

  /* --------------- derive sub-categories for dropdown --------------- */
  const subcategories: Subcategory[] = useMemo(() => {
    if (!selectedCategory) return [];

    return sitePages
      .filter((p) => {
        const segments = p.href.split('/').filter(Boolean);
        return p.href.startsWith(`/category/${selectedCategory}/`) && segments.length === 3;
      })
      .map((p) => {
        const slug = p.href.split('/')[3];
        const match = subcategoriesDB.find((s) => s.slug === slug);
        return { label: p.label, slug, id: match ? match.id : 0 };
      })
      .filter((s) => s.id !== 0);
  }, [selectedCategory, sitePages, subcategoriesDB]);

  /* ------------------------------------------------------------------ */
  /*  SYNC: query -> local filters                                      */
  /* ------------------------------------------------------------------ */

  const syncingFromQuery = useRef(false);

  useEffect(() => {
    syncingFromQuery.current = true;

    if (qMin !== null || qMax !== null) {
      const baseMin = priceBounds.min;
      const baseMax = priceBounds.max;

      const nextMin = qMin !== null ? Math.max(baseMin, Math.round(qMin)) : priceRange[0];
      const nextMax = qMax !== null ? Math.max(nextMin, Math.round(qMax)) : priceRange[1];

      const clampedMin = Math.max(baseMin, Math.min(nextMin, baseMax));
      const clampedMax = Math.max(clampedMin, Math.min(nextMax, baseMax));

      if (clampedMin !== priceRange[0] || clampedMax !== priceRange[1]) {
        // query = осознанный источник
        priceTouchedRef.current = true;
        setPriceRange([clampedMin, clampedMax]);
      }
    }

    if (qCats.length === 1) {
      const slug = categoryIdToSlugMap.get(qCats[0]) || '';
      if (slug && slug !== selectedCategory) setSelectedCategory(slug);
      if (!slug && selectedCategory) setSelectedCategory('');
    }

    if (qSubs.length === 1) {
      if (selectedSubcategory !== qSubs[0]) setSelectedSubcategory(qSubs[0]);
    }

    const t = setTimeout(() => {
      syncingFromQuery.current = false;
    }, 0);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString(), priceBounds.min, priceBounds.max]);

  /* ------------------------------------------------------------------ */
  /*  SYNC: local filters -> query                                      */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (syncingFromQuery.current) return;

    const touched =
      priceTouchedRef.current || categoryTouchedRef.current || subcategoryTouchedRef.current;
    if (!touched) return;

    const params = new URLSearchParams(sp.toString());

    if (priceTouchedRef.current) {
      params.set('min', String(Math.max(0, Math.round(priceRange[0]))));
      params.set('max', String(Math.max(0, Math.round(priceRange[1]))));
    }

    if (selectedCategory) {
      const id = categorySlugToIdMap.get(selectedCategory);
      if (id) params.set('cats', String(id));
      else params.delete('cats');
    } else {
      params.delete('cats');
    }

    if (selectedSubcategory) {
      params.set('subs', String(Number(selectedSubcategory)));
    } else {
      params.delete('subs');
    }

    const nextQs = params.toString();
    const currentQs = sp.toString();
    if (nextQs === currentQs) return;

    router.replace(nextQs ? `${pathname}?${nextQs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange, selectedCategory, selectedSubcategory, sortOrder, priceBounds.min, priceBounds.max]);

  /* ----------------------------- filtering -------------------------- */
  useEffect(() => {
    const effectiveMin = qMin !== null ? qMin : priceRange[0];
    const effectiveMax = qMax !== null ? qMax : priceRange[1];

    // ВАЖНО: не делаем [...products] - это лишний пик памяти на мобиле
    let list = products;

    // фильтруем по видимости, если поле есть
    list = list.filter((p) => p.is_visible !== false);

    list = list.filter((p) => {
      const effective =
        p.discount_percent && p.discount_percent > 0
          ? Math.round(p.price * (1 - p.discount_percent / 100))
          : p.price;

      return effective >= effectiveMin && effective <= effectiveMax;
    });

    if (qCats.length > 0) {
      list = list.filter((p) => p.category_ids.some((id) => qCats.includes(id)));
    } else if (selectedCategory) {
      const catId = categorySlugToIdMap.get(selectedCategory);
      list = catId ? list.filter((p) => p.category_ids.includes(catId)) : [];
    }

    if (qSubs.length > 0) {
      list = list.filter((p) => p.subcategory_ids.some((id) => qSubs.includes(id)));
    } else if (selectedSubcategory) {
      list = list.filter((p) => p.subcategory_ids.includes(Number(selectedSubcategory)));
    }

    // сортировка создаст новый массив, ок
    const sorted = [...list].sort((a, b) => {
      const pa =
        a.discount_percent && a.discount_percent > 0
          ? Math.round(a.price * (1 - a.discount_percent / 100))
          : a.price;
      const pb =
        b.discount_percent && b.discount_percent > 0
          ? Math.round(b.price * (1 - b.discount_percent / 100))
          : b.price;
      return sortOrder === 'asc' ? pa - pb : pb - pa;
    });

    setFilteredProducts(sorted);
  }, [
    products,
    priceRange,
    selectedCategory,
    selectedSubcategory,
    sortOrder,
    qMin,
    qMax,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    sp.toString(),
  ]);

  /* ----------------------------- render ----------------------------- */
  return (
    <section
      className="min-h-screen bg-white text-black py-8 md:py-12"
      style={{
        paddingBottom: 'calc(var(--kth-bottom-nav-h, 0px) + 24px)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-bold">Каталог товаров</h1>
          <SortDropdown sortOrder={sortOrder} setSortOrder={setSortOrder} />
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          <div className="hidden md:block w-full md:w-[320px] shrink-0">
            <FilterSection
              priceRange={priceRange}
              setPriceRange={(v) => {
                priceTouchedRef.current = true;
                setPriceRange(v);
              }}
              selectedCategory={selectedCategory}
              setSelectedCategory={(v) => {
                categoryTouchedRef.current = true;
                setSelectedCategory(v);
              }}
              selectedSubcategory={selectedSubcategory}
              setSelectedSubcategory={(v) => {
                subcategoryTouchedRef.current = true;
                setSelectedSubcategory(v);
              }}
              categories={categories}
              subcategories={subcategories}
            />
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <p className="text-center text-red-500 text-lg">{error}</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 text-lg">Товары не найдены</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}