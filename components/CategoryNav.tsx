'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { supabasePublic as supabase } from '@/lib/supabase/public';

type Category = {
  id: number;
  name: string;
  slug: string;
  subcategories: { id: number; name: string; slug: string }[];
};

// Локальный кэш для категорий
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

export default function CategoryNav({ initialCategories }: { initialCategories: Category[] }) {
  const pathname = usePathname() || '/';
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Функция для загрузки категорий
  const fetchCategories = async () => {
    try {
      // Используем кэшированные данные, если они есть
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
          subcategories!subcategories_category_id_fkey(id, name, slug)
        `)
        .order('id', { ascending: true });
      console.log('Supabase query duration for categories in CategoryNav:', Date.now() - start, 'ms');

      if (error) throw error;

      const updatedData = data.map((cat) => ({
        ...cat,
        slug: cat.slug || generateSlug(cat.name),
        subcategories: cat.subcategories
          ? cat.subcategories.map((sub) => ({
              ...sub,
              slug: sub.slug || generateSlug(sub.name),
            }))
          : [],
      }));

      // Сохраняем в кэш
      categoryCache = updatedData;
      setCategories(updatedData);
    } catch (err) {
      console.error('Ошибка загрузки категорий в CategoryNav:', err);
      setError('Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Если начальные данные переданы, используем их
    if (initialCategories && initialCategories.length > 0) {
      const updatedData = initialCategories.map((cat) => ({
        ...cat,
        slug: cat.slug || generateSlug(cat.name),
        subcategories: cat.subcategories
          ? cat.subcategories.map((sub) => ({
              ...sub,
              slug: sub.slug || generateSlug(sub.name),
            }))
          : [],
      }));
      setCategories(updatedData);
      setLoading(false);
      categoryCache = updatedData; // Сохраняем в кэш
    } else {
      fetchCategories(); // Вызываем функцию для загрузки категорий
    }
  }, [initialCategories]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
    window.gtag?.('event', `category_nav_scroll_${dir}`, {
      event_category: 'navigation',
    });
    window.ym?.(12345678, 'reachGoal', `category_nav_scroll_${dir}`);
  };

  return (
    <nav
      className="sticky top-14 sm:top-16 z-40 bg-white border-b text-black font-sans"
      aria-label="Навигация по категориям"
    >
      <div className="sm:hidden overflow-x-auto no-scrollbar">
        <ul className="flex gap-2 px-4 py-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex-shrink-0">
                <div className="h-8 w-24 rounded-full bg-gray-200 animate-pulse" />
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
                <li key={cat.id} className="flex-shrink-0">
                  <Link
                    href={href}
                    className={`inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      window.gtag?.('event', 'category_nav_click', {
                        event_category: 'navigation',
                        category: cat.name,
                      });
                      window.ym?.(12345678, 'reachGoal', 'category_nav_click', {
                        category: cat.name,
                      });
                    }}
                  >
                    {cat.name}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <ul className="hidden sm:flex gap-12 px-4 py-4 justify-center relative">
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
              <li
                key={cat.id}
                className={`relative flex items-center ${index < categories.length - 1 ? 'after:content-["·"] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:text-gray-400 after:ml-6' : ''}`}
              >
                <div className="group inline-block">
                  <Link
                    href={href}
                    className={`px-2 py-1 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-black underline'
                        : 'text-gray-500 hover:text-black hover:underline'
                    }`}
                    onClick={() => {
                      window.gtag?.('event', 'category_nav_click', {
                        event_category: 'navigation',
                        category: cat.name,
                      });
                      window.ym?.(12345678, 'reachGoal', 'category_nav_click', {
                        category: cat.name,
                      });
                    }}
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
                            });
                            window.ym?.(
                              12345678,
                              'reachGoal',
                              'subcategory_nav_click',
                              { subcategory: sub.name }
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
              fetchCategories(); // Теперь функция доступна
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