'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useState, Suspense } from 'react';
import { supabasePublic as supabase } from '@/lib/supabase/public';

type Category = {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
  subcategories: { id: number; name: string; slug: string; is_visible: boolean }[];
};

type Crumb = {
  href: string;
  label: string;
};

// Статические названия для других страниц
const staticTitles: Record<string, string> = {
  cart: 'Корзина',
  account: 'Профиль',
  catalog: 'Каталог',
  admin: 'Админ-панель',
  policy: 'Политика конфиденциальности',
  thank_you: 'Спасибо за заказ',
};

// Локальный кэш для категорий
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

function Breadcrumbs({ productTitle }: { productTitle?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subcategorySlug = searchParams.get('subcategory') || 'all';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки категорий в Breadcrumbs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    const channel = supabase
      .channel('categories-subcategories-changes-breadcrumbs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          process.env.NODE_ENV !== "production" && console.log('Categories change detected in Breadcrumbs:', payload);
          categoryCache = null;
          fetchCategories();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subcategories' },
        (payload) => {
          process.env.NODE_ENV !== "production" && console.log('Subcategories change detected in Breadcrumbs:', payload);
          categoryCache = null;
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const crumbs: Crumb[] = [];
  crumbs.push({ href: '/', label: 'Главная' });

  let currentPath = '';
  const segments = pathname.split('/').filter(Boolean);

  // Хлебные крошки отображаются всегда, кроме главной страницы
  const shouldRender = pathname !== '/';

  if (shouldRender && !loading) {
    segments.forEach((seg, idx) => {
      currentPath += `/${seg}`;

      // Первый сегмент "category"
      if (seg === 'category' && idx === 0) {
        crumbs.push({ href: '/catalog', label: 'Каталог' });
      }
      // Второй сегмент — категория
      else if (idx === 1 && segments[0] === 'category') {
        const category = categories.find((cat) => cat.slug === seg);
        if (category) {
          crumbs.push({ href: `/category/${category.slug}`, label: category.name });
        } else {
          const label = decodeURIComponent(seg)
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          crumbs.push({ href: currentPath, label });
        }
      }
      // Пропускаем сегмент "subcategory" (он обрабатывается через ?subcategory)
      else if (idx === 2 && segments[0] === 'category' && segments[2] === 'subcategory') {
        return;
      }
      // Четвёртый сегмент — подкатегория (обрабатывается через параметр ?subcategory)
      else if (idx === 3 && segments[0] === 'category' && segments[2] === 'subcategory') {
        return;
      }
      // Страница товара
      else if (seg === 'product' && idx === 0) {
        crumbs.push({ href: '/catalog', label: 'Каталог' });
      }
      // Пропускаем сегмент "product/[id]"
      else if (seg === 'product' && idx === 1) {
        return;
      }
      // Название товара
      else if (idx === 1 && segments[0] === 'product') {
        const productCategory = categories.find((cat) => cat.slug === 'klubnichnye-bukety');
        if (productCategory) {
          crumbs.push({ href: `/category/${productCategory.slug}`, label: productCategory.name });
        }
        if (productTitle) {
          crumbs.push({ href: currentPath, label: productTitle });
        } else {
          crumbs.push({ href: currentPath, label: `Товар ${segments[1]}` });
        }
      }
      // Другие страницы (about, delivery, cart и т.д.)
      else {
        const label = staticTitles[seg] || decodeURIComponent(seg)
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        crumbs.push({ href: currentPath, label });
      }
    });
  }

  if (!shouldRender) {
    return null;
  }

  return (
    <nav
      aria-label="Хлебные крошки"
      className="max-w-7xl mx-auto px-4 py-2 text-sm text-gray-500 font-sans"
    >
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <ol className="flex flex-wrap gap-1 items-center" role="list">
          {crumbs.map((c, i) => (
            <Fragment key={c.href}>
              {i > 0 && (
                <span aria-hidden="true" className="mx-1 text-gray-400">
                  /
                </span>
              )}
              <li role="listitem">
                {i === crumbs.length - 1 ? (
                  <span className="text-black font-medium" aria-current="page">
                    {c.label}
                  </span>
                ) : (
                  <Link
                    href={c.href}
                    className="hover:underline text-gray-500"
                    onClick={() => {
                      window.gtag?.('event', 'breadcrumb_click', {
                        event_category: 'navigation',
                        path: c.href,
                      });
                      window.ym?.(96644553, 'reachGoal', 'breadcrumb_click', {
                        path: c.href,
                      });
                    }}
                  >
                    {c.label}
                  </Link>
                )}
              </li>
              {i === crumbs.length - 1 && segments[0] === 'category' && segments.length >= 2 && (
                <Suspense fallback={null}>
                  <SubcategoryCrumb categories={categories} />
                </Suspense>
              )}
            </Fragment>
          ))}
        </ol>
      )}
    </nav>
  );
}

// Компонент для отображения подкатегории
function SubcategoryCrumb({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const subcategorySlug = searchParams.get('subcategory') || 'all';

  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'category' || segments.length < 2) return null;

  const categorySlug = segments[1];
  const category = categories.find((cat) => cat.slug === categorySlug);
  if (!category) return null;

  if (subcategorySlug !== 'all') {
    const subcategory = category.subcategories.find((sub) => sub.slug === subcategorySlug);
    if (subcategory) {
      return (
        <li role="listitem" className="flex gap-2">
          <span aria-hidden="true" className="mx-1 text-gray-400">/</span>
          <span className="text-black font-medium" aria-current="page">
            {subcategory.name}
          </span>
        </li>
      );
    }
  }
  return null;
}

export default Breadcrumbs;
