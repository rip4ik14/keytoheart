'use client';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useState, Suspense } from 'react';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { JsonLd } from 'react-schemaorg';

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
      process.env.NODE_ENV !== 'production' &&
        console.error('Ошибка загрузки категорий в Breadcrumbs:', err);
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
  }, []);

  const crumbs: Crumb[] = [];
  crumbs.push({ href: '/', label: 'Главная' });

  let currentPath = '';
  const segments = pathname.split('/').filter(Boolean);
  const shouldRender = pathname !== '/';

  if (shouldRender && !loading) {
    segments.forEach((seg, idx) => {
      currentPath += `/${seg}`;

      if (seg === 'category' && idx === 0) {
        crumbs.push({ href: '/catalog', label: 'Каталог' });
      } else if (idx === 1 && segments[0] === 'category') {
        const cat = categories.find((c) => c.slug === seg);
        crumbs.push({
          href: `/category/${seg}`,
          label: cat
            ? cat.name
            : decodeURIComponent(seg)
                .split('-')
                .map((w) => w[0].toUpperCase() + w.slice(1))
                .join(' '),
        });
      } else if (idx === 2 && segments[0] === 'category' && segments[2] === 'subcategory') {
        // пропускаем
      } else if (idx === 3 && segments[0] === 'category' && segments[2] === 'subcategory') {
        // пропускаем
      } else if (seg === 'product' && idx === 0) {
        crumbs.push({ href: '/catalog', label: 'Каталог' });
      } else if (seg === 'product' && idx === 1) {
        // пропускаем
      } else if (idx === 1 && segments[0] === 'product') {
        const defaultCat = categories.find((c) => c.slug === 'klubnichnye-bukety');
        if (defaultCat) crumbs.push({ href: `/category/${defaultCat.slug}`, label: defaultCat.name });
        crumbs.push({ href: currentPath, label: productTitle || `Товар ${segments[1]}` });
      } else {
        const lbl =
          staticTitles[seg] ||
          decodeURIComponent(seg)
            .split('-')
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join(' ');
        crumbs.push({ href: currentPath, label: lbl });
      }
    });
  }

  if (!shouldRender) return null;

  // ---- SCHEMA.ORG JSON-LD ----
  // Составляем абсолютные ссылки для itemListElement
  let absOrigin = '';
  if (typeof window !== 'undefined') {
    absOrigin = window.location.origin;
  }
  // Fallback для SSR — можно подставить домен вручную, если что
  if (!absOrigin) absOrigin = 'https://keytoheart.ru';

  const jsonLdBreadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: absOrigin + c.href,
    })),
  };

  return (
    <>
      {/* SCHEMA.ORG JSON-LD */}
      {!loading && shouldRender && (
        <JsonLd item={jsonLdBreadcrumbs} />
      )}

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
    </>
  );
}

function SubcategoryCrumb({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const slug = searchParams.get('subcategory') || 'all';

  const segs = pathname.split('/').filter(Boolean);
  if (segs[0] !== 'category' || segs.length < 2) return null;

  const cat = categories.find((c) => c.slug === segs[1]);
  if (!cat || slug === 'all') return null;

  const sub = cat.subcategories.find((s) => s.slug === slug);
  if (!sub) return null;

  return (
    <li role="listitem" className="flex gap-2">
      <span aria-hidden="true" className="mx-1 text-gray-500">
        /
      </span>
      <span className="text-black font-medium" aria-current="page">
        {sub.name}
      </span>
    </li>
  );
}

export default Breadcrumbs;
