// ✅ Путь: components/CatalogClient.tsx
'use client';

import { useEffect, useMemo, useRef, useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import ProductCard from '@components/ProductCard';
import ProductCardSkeleton from '@components/ProductCardSkeleton';
import FilterSection from '@components/FilterSection';
import SortDropdown from '@components/SortDropdown';

/* ===================== EXPORTED TYPES (для app/catalog/page.tsx) ===================== */
export interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent?: number | null;
  original_price?: number | null;
  in_stock?: boolean;
  images: string[];
  production_time?: number | null;
  is_popular?: boolean | null;
  category_ids: number[];
  subcategory_ids: number[];
}

export type SitePage = {
  label: string;
  href: string;
};

export type CategoryFromDB = {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
};

export type SubcategoryFromDB = {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
};

/* ===================== DEBOUNCE ===================== */
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/* ===================== HELPERS ===================== */
function safeNum(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseCsvNums(v: string | null): number[] {
  if (!v) return [];
  return String(v)
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/* ===================== MAIN COMPONENT ===================== */
export default function CatalogClient({
  initialProducts,
  initialSitePages,
  initialSubcategoriesDB,
  categoriesDB,
}: {
  initialProducts: Product[];
  initialSitePages: SitePage[];
  initialSubcategoriesDB: SubcategoryFromDB[];
  categoriesDB: CategoryFromDB[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const [products] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);

  /* ---------------------- Price Bounds ---------------------- */
  const priceBounds = useMemo(() => {
    let max = 0;
    for (const p of products) {
      const eff = p.discount_percent
        ? Math.round(p.price * (1 - p.discount_percent / 100))
        : p.price;
      if (eff > max) max = eff;
    }
    const roundedMax = Math.ceil(Math.max(max, 5000) / 500) * 500;
    return { min: 0, max: roundedMax };
  }, [products]);

  /* --------------------- Filters State --------------------- */
  const [priceRange, setPriceRange] = useState<[number, number]>([0, priceBounds.max]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const priceTouchedRef = useRef(false);

  /* --------------------- Query Params --------------------- */
  const qMin = safeNum(sp.get('min'));
  const qMax = safeNum(sp.get('max'));
  const qCats = parseCsvNums(sp.get('cats'));
  const qSubs = parseCsvNums(sp.get('subs'));

  /* --------------------- Maps --------------------- */
  const categorySlugToId = useMemo(() => {
    const m = new Map<string, number>();
    categoriesDB.forEach((c) => m.set(c.slug, c.id));
    return m;
  }, [categoriesDB]);

  const categoryIdToSlug = useMemo(() => {
    const m = new Map<number, string>();
    categoriesDB.forEach((c) => m.set(c.id, c.slug));
    return m;
  }, [categoriesDB]);

  /* --------------------- Categories & Subcategories --------------------- */
  const categories = useMemo(() => {
    return initialSitePages
      .filter((p) => p.href.startsWith('/category/') && p.href.split('/').filter(Boolean).length === 2)
      .map((p) => {
        const slug = p.href.split('/')[2];
        return { label: p.label, slug };
      });
  }, [initialSitePages]);

  const subcategories = useMemo(() => {
    if (!selectedCategorySlug) return [];
    return initialSitePages
      .filter((p) => p.href.startsWith(`/category/${selectedCategorySlug}/`))
      .map((p) => {
        const slug = p.href.split('/')[3];
        const match = initialSubcategoriesDB.find((s) => s.slug === slug);
        return { label: p.label, slug, id: match?.id || 0 };
      })
      .filter((s) => s.id !== 0);
  }, [selectedCategorySlug, initialSitePages, initialSubcategoriesDB]);

  /* --------------------- Sync Query → Local --------------------- */
  useEffect(() => {
    if (qMin !== null || qMax !== null) {
      const newMin = qMin !== null ? Math.max(priceBounds.min, qMin) : priceRange[0];
      const newMax = qMax !== null ? Math.min(priceBounds.max, qMax) : priceRange[1];
      setPriceRange([newMin, newMax]);
      priceTouchedRef.current = true;
    }

    if (qCats.length === 1) {
      const slug = categoryIdToSlug.get(qCats[0]) || '';
      if (slug) setSelectedCategorySlug(slug);
    }

    if (qSubs.length === 1) {
      setSelectedSubcategoryId(qSubs[0]);
    }
  }, [sp.toString(), priceBounds, categoryIdToSlug]);

  /* --------------------- Debounced URL Update --------------------- */
  const updateURL = useCallback(
    debounce((min: number, max: number, catSlug: string, subId: number | '') => {
      startTransition(() => {
        const params = new URLSearchParams();

        params.set('min', String(Math.round(min)));
        params.set('max', String(Math.round(max)));

        if (catSlug) {
          const id = categorySlugToId.get(catSlug);
          if (id) params.set('cats', String(id));
        }
        if (subId) params.set('subs', String(subId));

        const qs = params.toString();
        router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
      });
    }, 600),
    [router, categorySlugToId]
  );

  useEffect(() => {
    updateURL(priceRange[0], priceRange[1], selectedCategorySlug, selectedSubcategoryId);
  }, [priceRange, selectedCategorySlug, selectedSubcategoryId, updateURL]);

  /* --------------------- Real Filtering --------------------- */
  useEffect(() => {
    let list = [...products];

    const minPrice = qMin !== null ? qMin : priceRange[0];
    const maxPrice = qMax !== null ? qMax : priceRange[1];

    list = list.filter((p) => {
      const effectivePrice = p.discount_percent
        ? Math.round(p.price * (1 - p.discount_percent / 100))
        : p.price;
      return effectivePrice >= minPrice && effectivePrice <= maxPrice;
    });

    if (qCats.length > 0) {
      list = list.filter((p) => p.category_ids.some((id) => qCats.includes(id)));
    } else if (selectedCategorySlug) {
      const catId = categorySlugToId.get(selectedCategorySlug);
      if (catId) list = list.filter((p) => p.category_ids.includes(catId));
    }

    if (qSubs.length > 0) {
      list = list.filter((p) => p.subcategory_ids.some((id) => qSubs.includes(id)));
    } else if (selectedSubcategoryId) {
      list = list.filter((p) => p.subcategory_ids.includes(Number(selectedSubcategoryId)));
    }

    list.sort((a, b) => {
      const pa = a.discount_percent ? Math.round(a.price * (1 - a.discount_percent / 100)) : a.price;
      const pb = b.discount_percent ? Math.round(b.price * (1 - b.discount_percent / 100)) : b.price;
      return sortOrder === 'asc' ? pa - pb : pb - pa;
    });

    setFilteredProducts(list);
  }, [
    products,
    priceRange,
    selectedCategorySlug,
    selectedSubcategoryId,
    sortOrder,
    qMin,
    qMax,
    sp.toString(),
    categorySlugToId,
  ]);

  return (
    <section
      className="min-h-screen bg-white py-8 md:py-12"
      style={{ paddingBottom: 'calc(var(--kth-bottom-nav-h, 0px) + 80px)' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold">Каталог</h1>
          <SortDropdown sortOrder={sortOrder} setSortOrder={setSortOrder} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block w-full lg:w-80 shrink-0">
            <FilterSection
              priceRange={priceRange}
              setPriceRange={(v) => {
                priceTouchedRef.current = true;
                setPriceRange(v);
              }}
              selectedCategory={selectedCategorySlug}
              setSelectedCategory={setSelectedCategorySlug}
              selectedSubcategory={selectedSubcategoryId}
              setSelectedSubcategory={setSelectedSubcategoryId}
              categories={categories}
              subcategories={subcategories}
            />
          </div>

          <div className="flex-1">
            {isPending ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center py-20 text-xl text-gray-500">По вашему запросу ничего не найдено</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}