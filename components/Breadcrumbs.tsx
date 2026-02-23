// ✅ Путь: components/Breadcrumbs.tsx
'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { supabasePublic as supabase } from '@/lib/supabase/public';

// Типы
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

let categoryCache: Category[] | null = null;

// Транслитерация для генерации slug
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

const humanizeSlug = (slug: string) =>
  decodeURIComponent(slug)
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

export default function Breadcrumbs({
  productTitle,
  categorySlug,
  categoryName,
}: {
  productTitle?: string;
  categorySlug?: string;
  categoryName?: string;
}) {
  const pathname = usePathname() || '/';

  // ✅ Вместо useSearchParams() - читаем query на клиенте через window
  // Это снимает требование Suspense для useSearchParams и не ломает build /404
  const [subcategoryFromQuery, setSubcategoryFromQuery] = useState<string>('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readQuery = () => {
      const sp = new URLSearchParams(window.location.search);
      setSubcategoryFromQuery(sp.get('subcategory') || 'all');
    };

    readQuery();

    // На случай навигации назад/вперёд
    const onPopState = () => readQuery();
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [pathname]);

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

      const updatedData: Category[] = (data ?? []).map((cat: any) => {
        const subcats = cat.subcategories
          ? cat.subcategories
              .filter((s: any) => s.is_visible !== false)
              .map((s: any) => ({
                ...s,
                slug: s.slug || generateSlug(s.name),
                is_visible: s.is_visible ?? true,
              }))
          : [];

        return {
          ...cat,
          is_visible: cat.is_visible ?? true,
          slug: cat.slug || generateSlug(cat.name),
          subcategories: subcats,
        };
      });

      categoryCache = updatedData;
      setCategories(updatedData);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Ошибка загрузки категорий в Breadcrumbs:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const shouldRender = pathname !== '/';

  if (!shouldRender) return null;

  const crumbs: Crumb[] = [{ href: '/', label: 'Главная' }];

  // /category/[slug] или /category/[slug]/[subslug]
  if (segments[0] === 'category' && segments[1]) {
    crumbs.push({ href: '/catalog', label: 'Каталог' });

    const catSlug = segments[1];
    const cat = categories.find((c) => c.slug === catSlug);

    crumbs.push({
      href: `/category/${catSlug}`,
      label: cat ? cat.name : humanizeSlug(catSlug),
    });

    // Новый формат: /category/[catSlug]/[subSlug]
    const subSlugFromPath = segments[2];

    if (!loading && cat) {
      // 1) если подкатегория в пути
      if (subSlugFromPath) {
        const sub = cat.subcategories.find((s) => s.slug === subSlugFromPath);
        crumbs.push({
          href: `/category/${catSlug}/${subSlugFromPath}`,
          label: sub ? sub.name : humanizeSlug(subSlugFromPath),
        });
      }

      // 2) иначе - старый формат query ?subcategory=
      else if (subcategoryFromQuery !== 'all') {
        const sub = cat.subcategories.find((s) => s.slug === subcategoryFromQuery);
        if (sub) {
          crumbs.push({
            href: `/category/${catSlug}?subcategory=${subcategoryFromQuery}`,
            label: sub.name,
          });
        }
      }
    }
  }

  // /product/[id]
  else if (segments[0] === 'product' && segments[1]) {
    crumbs.push({ href: '/catalog', label: 'Каталог' });

    if (categorySlug && categoryName) {
      crumbs.push({ href: `/category/${categorySlug}`, label: categoryName });
    }

    crumbs.push({
      href: `/product/${segments[1]}`,
      label: productTitle || `Товар ${segments[1]}`,
    });
  }

  // остальные страницы
  else {
    let currentPath = '';
    segments.forEach((seg) => {
      currentPath += `/${seg}`;
      const lbl = staticTitles[seg] || humanizeSlug(seg);
      crumbs.push({ href: currentPath, label: lbl });
    });
  }

  return (
    <nav
      aria-label="Хлебные крошки"
      className="max-w-7xl mx-auto px-4 py-2 text-sm text-gray-500 font-sans"
    >
      {loading && segments[0] === 'category' ? (
        <div>Загрузка...</div>
      ) : (
        <ol className="flex flex-wrap gap-1 items-center" role="list">
          {crumbs.map((c, i) => (
            <Fragment key={`${c.href}-${i}`}>
              {i > 0 && (
                <span aria-hidden="true" className="mx-1 text-gray-500">
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
                      if (YM_ID !== undefined) {
                        callYm(YM_ID, 'reachGoal', 'breadcrumb_click', { path: c.href });
                      }
                    }}
                  >
                    {c.label}
                  </Link>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      )}
    </nav>
  );
}