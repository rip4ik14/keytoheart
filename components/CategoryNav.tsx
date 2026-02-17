'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import type { Category } from '@/types/category';

import CatalogFilterModal from '@components/CatalogFilterModal';
import { ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react';

let categoryCache: Category[] | null = null;

const transliterate = (text: string) => {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ы: 'y',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };

  return text
    .split('')
    .map((char) => map[char.toLowerCase()] || char)
    .join('');
};

const generateSlug = (name: string) =>
  transliterate(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');

const normalizeSlug = (v: any) =>
  String(v ?? '')
    .trim()
    .toLowerCase();

type CategoryNavProps = {
  initialCategories: Category[];
  showMobileFilter?: boolean;
};

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

export default function CategoryNav({ initialCategories, showMobileFilter = false }: CategoryNavProps) {
  const pathname = usePathname() || '/';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  const [canScrollRight, setCanScrollRight] = useState(false);

  const currentCategorySlug = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] !== 'category') return null;
    return parts[1] || null;
  }, [pathname]);

  const hydrate = (raw: any[]): Category[] => {
    return (raw || [])
      .filter((cat: any) => cat?.is_visible !== false)
      .map((cat: any) => {
        const catSlug = normalizeSlug(cat.slug) || generateSlug(cat.name);

        const subcategories = (cat.subcategories || [])
          .filter((sub: any) => sub?.is_visible !== false)
          .map((sub: any) => {
            const subSlug = normalizeSlug(sub.slug) || generateSlug(sub.name);
            return {
              ...sub,
              slug: subSlug,
              is_visible: sub.is_visible ?? true,
            };
          });

        return {
          ...cat,
          slug: catSlug,
          is_visible: cat.is_visible ?? true,
          subcategories,
        };
      });
  };

  const fetchCategories = async () => {
    try {
      if (categoryCache) {
        setCategories(categoryCache);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('categories')
        .select(
          `
          id,
          name,
          slug,
          is_visible,
          subcategories!subcategories_category_id_fkey(id, name, slug, is_visible)
        `,
        )
        .eq('is_visible', true)
        .order('id', { ascending: true });

      if (error) throw error;

      const updated = hydrate(data as any[]);
      categoryCache = updated;
      setCategories(updated);
    } catch {
      setError('Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError(null);

    if (initialCategories?.length > 0) {
      const updated = hydrate(initialCategories as any[]);
      setCategories(updated);
      categoryCache = updated;
    } else {
      fetchCategories();
    }

    const channel = supabase
      .channel('categories-subcategories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        categoryCache = null;
        fetchCategories();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => {
        categoryCache = null;
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategories]);

  const trackCategory = (name: string) => {
    window.gtag?.('event', 'category_nav_click', {
      event_category: 'navigation',
      category: name,
      type: 'category',
    });

    if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'category_nav_click', { category: name, type: 'category' });
  };

  const trackSubcategory = (name: string) => {
    window.gtag?.('event', 'subcategory_nav_click', {
      event_category: 'navigation',
      subcategory: name,
      type: 'subcategory',
    });

    if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'subcategory_nav_click', { subcategory: name, type: 'subcategory' });
  };

  // центрируем активную вкладку как в телеге
  useEffect(() => {
    const wrap = scrollRef.current;
    if (!wrap) return;

    const activeKey = currentCategorySlug ? `cat:${currentCategorySlug}` : 'all';
    const el = tabRefs.current[activeKey];
    if (!el) return;

    const wrapRect = wrap.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const elCenter = elRect.left + elRect.width / 2;
    const wrapCenter = wrapRect.left + wrapRect.width / 2;
    const delta = elCenter - wrapCenter;

    wrap.scrollBy({ left: delta, behavior: 'smooth' });
  }, [currentCategorySlug, categories.length]);

  // индикатор "можно скроллить вправо"
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const calc = () => {
      const max = el.scrollWidth - el.clientWidth;
      const right = el.scrollLeft < max - 2;
      setCanScrollRight(right);
    };

    calc();
    el.addEventListener('scroll', calc, { passive: true });
    window.addEventListener('resize', calc);

    return () => {
      el.removeEventListener('scroll', calc);
      window.removeEventListener('resize', calc);
    };
  }, [categories.length, loading, showMobileFilter]);

  const nudgeRight = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: 180, behavior: 'smooth' });
  };

 

  const MobileTab = ({
    href,
    label,
    active,
    tabKey,
    onClick,
  }: {
    href: string;
    label: string;
    active: boolean;
    tabKey: string;
    onClick?: () => void;
  }) => (
    <Link
      href={href}
      ref={(el) => {
        tabRefs.current[tabKey] = el;
      }}
      className={cls(
        'shrink-0',
        'h-9',
        'px-4',
        'rounded-full',
        'inline-flex items-center',
        'border',
        'backdrop-blur-xl kth-android-no-blur',
        'transition-all duration-200',
        active
          ? 'bg-white/90 border-black/10 text-black shadow-[0_10px_26px_rgba(0,0,0,0.10)]'
          : 'bg-white/40 border-black/10 text-black/70 active:bg-white/55',
      )}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      style={{ maxWidth: 220 }}
    >
      <span className="truncate text-[13px] font-semibold leading-none">{label}</span>
    </Link>
  );

  return (
    <nav className="bg-transparent text-black font-sans" aria-label="Навигация по категориям">
      {/* mobile - tabs как Telegram */}
      <div className="sm:hidden">
        <div className="relative">
          {/* right fade + chevron */}
          <div
            className={cls(
              'pointer-events-none absolute top-0 right-0 h-full w-12',
              'transition-opacity duration-200',
              canScrollRight ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden="true"
            style={{
              background: 'linear-gradient(to left, rgba(255,255,255,0.90), rgba(255,255,255,0))',
            }}
          />
          <button
            type="button"
            onClick={nudgeRight}
            className={cls(
              'absolute right-1 top-1/2 -translate-y-1/2',
              'w-8 h-8 rounded-full',
              'bg-white/75 backdrop-blur-xl kth-android-no-blur kth-android-lite-shadow',
              'border border-black/10',
              'shadow-[0_10px_26px_rgba(0,0,0,0.10)]',
              'flex items-center justify-center',
              'transition-opacity duration-200',
              canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            aria-label="Показать еще категории"
          >
            <ChevronRight className="w-4 h-4 text-black/70" />
          </button>

          <div
            ref={scrollRef}
            className={cls(
              'px-2 pr-12',
              'overflow-x-auto no-scrollbar',
              '[-webkit-overflow-scrolling:touch]',
              'snap-x snap-mandatory',
              'scroll-px-2',
            )}
            aria-label="Категории (tabs)"
          >
            <div className="flex gap-2 py-2">
             

              {/* Фильтр (если нужно на этих страницах) */}
              {showMobileFilter && (
                <motion.button
                  type="button"
                  className={cls(
                    'shrink-0 snap-start',
                    'h-9 px-3',
                    'rounded-full',
                    'inline-flex items-center gap-2',
                    'border border-black/10',
                    'bg-white/40 backdrop-blur-xl kth-android-no-blur',
                    'text-black/80',
                    'shadow-[0_10px_26px_rgba(0,0,0,0.06)]',
                    'active:bg-white/55',
                    'transition',
                    'focus:ring-2 focus:ring-black/20 focus:outline-none',
                  )}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: 0.03 }}
                  aria-label="Открыть фильтр"
                  onClick={() => setFilterOpen(true)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-[13px] font-semibold leading-none">Фильтр</span>
                </motion.button>
              )}

              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="shrink-0 snap-start">
                      <div className="h-9 w-24 rounded-full bg-black/10 animate-pulse" />
                    </div>
                  ))
                : categories.length === 0
                  ? (
                    <div className="text-center text-black/50 w-full text-[13px] py-2">Категории отсутствуют</div>
                  )
                  : categories.map((cat, idx) => {
                      const href = `/category/${cat.slug}`;
                      const isActiveCategory = pathname.startsWith(href);
                      const isActiveSubcategory = cat.subcategories?.some((sub) =>
                        pathname.includes(`/category/${cat.slug}/${sub.slug}`),
                      );
                      const active = isActiveCategory || Boolean(isActiveSubcategory);

                      return (
                        <motion.div
                          key={cat.id}
                          className="shrink-0 snap-start"
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.18, delay: Math.min(idx, 10) * 0.03 }}
                        >
                          <MobileTab
                            href={href}
                            label={cat.name}
                            active={active}
                            tabKey={`cat:${cat.slug}`}
                            onClick={() => trackCategory(cat.name)}
                          />
                        </motion.div>
                      );
                    })}
            </div>
          </div>
        </div>
      </div>

      {/* desktop - как было */}
      <ul className="hidden sm:flex px-4 py-4 justify-center relative bg-white border-b">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <div className="h-6 w-20 rounded bg-neutral-200 animate-pulse" />
              </li>
            ))
          : categories.length === 0
            ? (
              <li className="text-center text-neutral-500">Категории отсутствуют</li>
            )
            : categories.map((cat, idx) => {
                const href = `/category/${cat.slug}`;
                const isActive = pathname.startsWith(href);
                const hasDropdown = (cat.subcategories?.length ?? 0) > 0;

                return (
                  <li key={cat.id} className="flex items-center">
                    <div className="relative group inline-block">
                      <Link
                        href={href}
                        className={[
                          'inline-flex items-center gap-1.5',
                          'px-2 py-1',
                          'text-sm font-medium transition-colors',
                          isActive ? 'text-black underline' : 'text-neutral-500 hover:text-black hover:underline',
                          'focus:ring-2 focus:ring-black/20 focus:outline-none',
                        ].join(' ')}
                        onClick={() => trackCategory(cat.name)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="whitespace-nowrap">{cat.name}</span>

                        {hasDropdown && (
                          <ChevronDown
                            className="h-4 w-4 text-neutral-400 transition-transform duration-200 group-hover:rotate-180"
                            aria-hidden="true"
                          />
                        )}
                      </Link>

                      {hasDropdown && (
                        <div
                          className="
                            absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64
                            bg-white border rounded-xl shadow-xl z-50
                            opacity-0 invisible translate-y-1 scale-[0.98]
                            group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100
                            transition-all duration-200 ease-out
                            py-2
                            before:absolute before:-top-4 before:left-0 before:w-full before:h-4
                            before:content-[''] before:block
                          "
                          role="menu"
                          aria-label={`Подкатегории для ${cat.name}`}
                          tabIndex={-1}
                        >
                          <div
                            className="
                              absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                              w-3 h-3 rotate-45 bg-white border-l border-t border-neutral-200
                              z-[-1]
                            "
                            aria-hidden="true"
                          />

                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/category/${cat.slug}/${sub.slug}`}
                              className="block px-4 py-2 text-sm text-black hover:bg-neutral-100 focus:bg-neutral-100 outline-none"
                              role="menuitem"
                              tabIndex={0}
                              onClick={() => trackSubcategory(sub.name)}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {idx < categories.length - 1 && (
                      <span aria-hidden="true" className="mx-4 text-neutral-300 select-none font-bold text-lg">
                        ·
                      </span>
                    )}
                  </li>
                );
              })}
      </ul>

      {error && (
        <div className="text-center text-sm text-black py-2">
          <p>{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchCategories();
            }}
            className="mt-2 px-4 py-1 bg-black text-white rounded hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20"
            aria-label="Повторить попытку загрузки категорий"
          >
            Повторить
          </button>
        </div>
      )}

      <CatalogFilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={(categories as any) || []}
        currentCategorySlug={currentCategorySlug}
      />
    </nav>
  );
}
