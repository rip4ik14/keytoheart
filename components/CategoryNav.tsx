'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { Category } from '@/types/category';

let categoryCache: Category[] | null = null;

const transliterate = (text: string) => {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ы: 'y', э: 'e', ю: 'yu', я: 'ya',
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

export default function CategoryNav({ initialCategories }: { initialCategories: Category[] }) {
  const pathname = usePathname() || '/';
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchCategories = async () => {
    try {
      if (categoryCache) {
        setCategories(categoryCache);
        setLoading(false);
        return;
      }
      setLoading(true);
      const start = Date.now();
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          is_visible,
          subcategories!subcategories_category_id_fkey(id, name, slug, is_visible)
        `)
        .eq('is_visible', true)
        .order('id', { ascending: true });
      if (error) throw error;
      const updatedData: Category[] = data.map((cat: any) => {
        const subcategories = cat.subcategories
          ? cat.subcategories
              .filter((sub: any) => sub.is_visible !== false)
              .map((sub: any) => ({
                ...sub,
                slug: sub.slug || generateSlug(sub.name),
                is_visible: sub.is_visible ?? true,
              }))
          : [];
        return {
          ...cat,
          is_visible: cat.is_visible ?? true,
          slug: cat.slug || generateSlug(cat.name),
          subcategories,
        };
      });
      categoryCache = updatedData;
      setCategories(updatedData);
    } catch (err) {
      setError('Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      const updatedData = initialCategories
        .filter((cat) => cat.is_visible !== false)
        .map((cat) => {
          const subcategories = cat.subcategories
            ? cat.subcategories
                .filter((sub) => sub.is_visible !== false)
                .map((sub) => ({
                  ...sub,
                  slug: sub.slug || generateSlug(sub.name),
                }))
            : [];
          return {
            ...cat,
            slug: cat.slug || generateSlug(cat.name),
            subcategories,
          };
        });
      setCategories(updatedData);
      categoryCache = updatedData;
    } else {
      fetchCategories();
    }
    const channel = supabase
      .channel('categories-subcategories-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          categoryCache = null;
          fetchCategories();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subcategories' },
        () => {
          categoryCache = null;
          fetchCategories();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialCategories]);

  return (
    <nav
      className="sticky top-14 sm:top-16 z-40 bg-white border-b text-black font-sans"
      aria-label="Навигация по категориям"
    >
      {/* Мобильная версия */}
      <div className="sm:hidden relative">
        <div className="overflow-x-auto no-scrollbar" ref={scrollRef}>
          <ul className="flex gap-2 px-4 py-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex-shrink-0">
                  <div className="h-8 w-24 rounded-xl bg-gray-200 animate-pulse" />
                </li>
              ))
            ) : categories.length === 0 ? (
              <li className="text-center text-gray-500 font-sans w-full">
                Категории отсутствуют
              </li>
            ) : (
              categories.map((cat) => {
                const href = `/category/${cat.slug}`;
                const isActiveCategory = pathname.startsWith(href);
                const isActiveSubcategory = cat.subcategories.some((sub) =>
                  pathname.includes(`/category/${cat.slug}/${sub.slug}`)
                );
                const active = isActiveCategory || isActiveSubcategory;

                return (
                  <motion.li
                    key={cat.id}
                    className="flex-shrink-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: cat.id * 0.05 }}
                  >
                    <Link
                      href={href}
                      className={`inline-block whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium border border-gray-300 transition-all ${
                        active
                          ? 'bg-black text-white shadow-sm scale-105'
                          : 'bg-white text-gray-800 hover:bg-gray-100 hover:shadow-sm'
                      } focus:ring-2 focus:ring-gray-500`}
                      onClick={() => {
                        window.gtag?.('event', 'category_nav_click', {
                          event_category: 'navigation',
                          category: cat.name,
                          type: 'category',
                        });
                        window.ym?.(96644553, 'reachGoal', 'category_nav_click', {
                          category: cat.name,
                          type: 'category',
                        });
                      }}
                      aria-current={active ? 'page' : undefined}
                    >
                      {cat.name}
                    </Link>
                  </motion.li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      {/* Десктоп */}
      <ul className="hidden sm:flex px-4 py-4 justify-center relative">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div className="h-6 w-20 rounded bg-gray-200 animate-pulse" />
            </li>
          ))
        ) : categories.length === 0 ? (
          <li className="text-center text-gray-500 font-sans">
            Категории отсутствуют
          </li>
        ) : (
          categories.map((cat, index) => {
            const href = `/category/${cat.slug}`;
            const isActive = pathname.startsWith(href);

            return (
              <li key={cat.id} className="flex items-center">
                <div className="group inline-block">
                  <Link
                    href={href}
                    className={`px-2 py-1 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-black underline'
                        : 'text-gray-500 hover:text-black hover:underline'
                    } focus:ring-2 focus:ring-gray-500`}
                    onClick={() => {
                      window.gtag?.('event', 'category_nav_click', {
                        event_category: 'navigation',
                        category: cat.name,
                        type: 'category',
                      });
                      window.ym?.(96644553, 'reachGoal', 'category_nav_click', {
                        category: cat.name,
                        type: 'category',
                      });
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {cat.name}
                  </Link>

                  {cat.subcategories?.length > 0 && (
                    <div
                      className="
                        absolute left-1/2 -translate-x-1/2 top-full mt-1 w-64
                        bg-white border rounded-xl shadow-xl z-50 opacity-0 scale-95
                        group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
                        pointer-events-none transition-all duration-200 ease-out
                        py-2
                        before:absolute before:-top-4 before:left-0 before:w-full before:h-4
                        before:content-[''] before:block before:pointer-events-auto
                      "
                      role="menu"
                      aria-label={`Подкатегории для ${cat.name}`}
                      tabIndex={-1}
                    >
                      <div
                        className="
                          absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-3 h-3 rotate-45 bg-white border-l border-t border-gray-200
                          z-[-1]
                        "
                        aria-hidden="true"
                      />
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/category/${cat.slug}/${sub.slug}`}
                          className="block px-4 py-2 text-sm text-black hover:bg-gray-100 font-sans focus:bg-gray-100 outline-none"
                          role="menuitem"
                          tabIndex={0}
                          onClick={() => {
                            window.gtag?.('event', 'subcategory_nav_click', {
                              event_category: 'navigation',
                              subcategory: sub.name,
                              type: 'subcategory',
                            });
                            window.ym?.(
                              96644553,
                              'reachGoal',
                              'subcategory_nav_click',
                              { subcategory: sub.name, type: 'subcategory' }
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              window.location.href = `/category/${cat.slug}/${sub.slug}`;
                            }
                          }}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                {/* Разделитель — только если не последний элемент */}
                {index < categories.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="mx-4 text-gray-300 select-none font-bold text-lg"
                  >
                    ·
                  </span>
                )}
              </li>
            );
          })
        )}
      </ul>

      {error && (
        <div className="text-center text-sm text-black py-2 font-sans">
          <p>{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchCategories();
            }}
            className="mt-2 px-4 py-1 bg-black text-white rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Повторить попытку загрузки категорий"
          >
            Повторить
          </button>
        </div>
      )}
    </nav>
  );
}
