'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';
import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import ProductCard from '@components/ProductCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Product } from '@components/CatalogClient';
import { ChevronDown } from 'lucide-react';

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
}

export interface Props {
  products: Product[];
  h1: string;
  slug: string; // slug категории
  subcategories: Subcategory[];
  seoText?: string | null;
}

type SortKey = 'newest' | 'price-asc' | 'price-desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'По новинкам' },
  { key: 'price-asc', label: 'По возрастанию цены' },
  { key: 'price-desc', label: 'По убыванию цены' },
];

export default function CategoryPageClient({ products, h1, slug, subcategories, seoText = null }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || '/';

  // sort оставляем в query
  const sort = (searchParams.get('sort') as SortKey) || 'newest';

  // активная подкатегория:
  // 1) берем из URL /category/{categorySlug}/{subcategorySlug}
  // 2) если нет - поддерживаем старое ?subcategory=...
  const activeSubFromPath = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    // ожидаем: ['category', '{categorySlug}', '{subcategorySlug?}']
    if (parts[0] !== 'category') return null;
    if (parts[1] !== slug) return null;
    return parts[2] || null;
  }, [pathname, slug]);

  const legacySubFromQuery = searchParams.get('subcategory');
  const subcategory = activeSubFromPath || legacySubFromQuery || 'all';

  const isSubRoute = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts[0] === 'category' && parts[1] === slug && !!parts[2];
  }, [pathname, slug]);

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  // подкатегории: автоскролл активного чипа
  const chipsWrapRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  // сортировка: dropdown
  const [sortOpen, setSortOpen] = useState(false);
  const sortWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let next = [...products];

    // если мы на /category/{cat}/{sub} - товары уже могут быть отфильтрованы на сервере
    // поэтому фильтрацию по subcategory_ids делаем только когда она реально есть
    if (subcategory !== 'all') {
      const subId = subcategories.find((s) => s.slug === subcategory)?.id;

      if (!subId) {
        // подкатегория не найдена - в норме это должно быть 404 на сервере,
        // но на клиенте просто покажем пусто
        next = [];
      } else {
        const hasSubIds = next.length > 0 && Array.isArray((next as any)[0]?.subcategory_ids);

        if (hasSubIds) {
          next = next.filter((p: any) => Array.isArray(p.subcategory_ids) && p.subcategory_ids.includes(subId));
        } else {
          // если subcategory_ids нет, а мы на sub-route, считаем что товары уже корректные
          // если не на sub-route - тогда показать пусто, чтобы не врать
          next = isSubRoute ? next : [];
        }
      }
    }

    if (sort === 'price-asc') next.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') next.sort((a, b) => b.price - a.price);
    else next.sort((a, b) => b.id - a.id);

    setFilteredProducts(next);
  }, [sort, subcategory, products, subcategories, isSubRoute]);

  useEffect(() => {
    window.gtag?.('event', 'view_category', { event_category: 'category', event_label: h1 });
    if (YM_ID) callYm(YM_ID, 'reachGoal', 'view_category', { category: h1 });
  }, [h1]);

  const normalizedSeoText = useMemo(() => {
    const t = (seoText || '').trim();
    return t.length ? t : null;
  }, [seoText]);

  const sortLabel = useMemo(() => SORT_OPTIONS.find((o) => o.key === sort)?.label || 'По новинкам', [sort]);

  // теперь меняем URL как у Labberry:
  // - all: /category/{slug}?sort=...
  // - sub: /category/{slug}/{subSlug}?sort=...
  const buildUrl = (nextSort: SortKey, nextSub: string) => {
    const base = nextSub === 'all' ? `/category/${slug}` : `/category/${slug}/${nextSub}`;
    const qs = `?sort=${encodeURIComponent(nextSort)}`;
    return `${base}${qs}`;
  };

  const setQuery = (next: { sort?: SortKey; subcategory?: string }) => {
    const nextSort = next.sort ?? sort;
    const nextSub = next.subcategory ?? subcategory;
    router.push(buildUrl(nextSort, nextSub));
  };

  // автоскролл активного чипа
  useEffect(() => {
    const el = chipRefs.current[subcategory];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [subcategory]);

  // закрытие dropdown по клику вне
  useEffect(() => {
    if (!sortOpen) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      const root = sortWrapRef.current;
      if (!root) return;
      const target = e.target as Node;
      if (!root.contains(target)) setSortOpen(false);
    };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('touchstart', onDown);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('touchstart', onDown);
    };
  }, [sortOpen]);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:pt-6" aria-label={`Товары ${h1}`}>
      <h1 className="mt-2 text-[28px] leading-[32px] sm:text-3xl sm:leading-tight font-sans font-semibold tracking-tight">
        {h1}
      </h1>

      {/* Подкатегории */}
      {subcategories.length > 0 && (
        <div className="mt-4">
          <div className="relative">
            <div
              ref={chipsWrapRef}
              className={[
                '-mx-4 px-4 pr-12',
                'flex gap-2 overflow-x-auto no-scrollbar',
                'pb-2',
                'snap-x snap-mandatory',
                'scroll-px-4',
                '[-webkit-overflow-scrolling:touch]',
              ].join(' ')}
              aria-label="Подкатегории"
            >
              <FilterChip
                ref={(el) => {
                  chipRefs.current['all'] = el;
                }}
                href={buildUrl(sort, 'all')}
                active={subcategory === 'all'}
                label="Все"
                onClick={(e) => {
                  e.preventDefault();
                  setQuery({ subcategory: 'all' });
                }}
              />

              {subcategories.map((sub) => (
                <FilterChip
                  key={sub.id}
                  ref={(el) => {
                    chipRefs.current[sub.slug] = el;
                  }}
                  href={buildUrl(sort, sub.slug)}
                  active={subcategory === sub.slug}
                  label={sub.name}
                  onClick={(e) => {
                    e.preventDefault();
                    setQuery({ subcategory: sub.slug });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Сортировка */}
      <div className="mt-3 flex items-center gap-2 text-[13px] text-neutral-600">
        <span>Сортировать:</span>

        <div className="relative" ref={sortWrapRef}>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 h-9 text-black bg-white hover:bg-neutral-50 hover:border-neutral-300 transition focus:outline-none focus:ring-2 focus:ring-black/20"
            onClick={() => setSortOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={sortOpen}
            aria-label="Открыть сортировку"
          >
            {sortLabel}
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </button>

          {sortOpen && (
            <div
              className="absolute left-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white shadow-xl z-50 overflow-hidden"
              role="menu"
              aria-label="Варианты сортировки"
            >
              {SORT_OPTIONS.map((opt) => {
                const active = opt.key === sort;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="menuitem"
                    className={[
                      'w-full text-left px-4 py-3 text-[13px] transition',
                      active ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100',
                    ].join(' ')}
                    onClick={() => {
                      setSortOpen(false);

                      window.gtag?.('event', 'sort_change', { event_category: 'catalog', sort_value: opt.key });
                      if (YM_ID) callYm(YM_ID, 'reachGoal', 'sort_change', { sort_value: opt.key });

                      setQuery({ sort: opt.key });
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Товары */}
      {filteredProducts.length === 0 ? (
        <p className="mt-6 text-neutral-500 font-sans">Нет товаров в этой категории.</p>
      ) : (
        <motion.div
          className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          aria-label="Список товаров"
        >
          {filteredProducts.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* SEO-текст */}
      {normalizedSeoText && (
        <section className="mt-10 sm:mt-12" aria-label="SEO текст категории">
          <div className="border-t pt-6">
            <h2 className="text-lg sm:text-xl font-sans font-semibold text-black mb-3">{h1}</h2>
            <div className="text-sm sm:text-base text-neutral-700 whitespace-pre-line leading-relaxed">{normalizedSeoText}</div>
          </div>
        </section>
      )}
    </section>
  );
}

type FilterChipProps = {
  href: string;
  active: boolean;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

const FilterChip = forwardRef<HTMLAnchorElement, FilterChipProps>(function FilterChip(
  { href, active, label, onClick }: FilterChipProps,
  ref,
) {
  return (
    <Link
      href={href}
      onClick={onClick}
      ref={ref}
      className={[
        'shrink-0 snap-start',
        'inline-flex items-center whitespace-nowrap',
        'h-9 px-4',
        'rounded-full',
        'border',
        'text-[13px] font-medium',
        'transition',
        active ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
        'focus:outline-none focus:ring-2 focus:ring-black/20',
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </Link>
  );
});
