/* -------------------------------------------------------------------------- */
/*  Главная страница (SEO-boost + TS-fix + Edge runtime)                      */
/* -------------------------------------------------------------------------- */
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList, FAQPage, WebPage, BreadcrumbList } from 'schema-dts';
import PromoGridServer from '@components/PromoGridServer';
import AdvantagesClient from '@components/AdvantagesClient';
import PopularProductsServer from '@components/PopularProductsServer';
import CategoryPreviewServer from '@components/CategoryPreviewServer';
import SkeletonCard from '@components/ProductCardSkeleton';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';

/* -------------------------- Типы и настройки -------------------------- */
interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent: number | null;
  in_stock: boolean;
  images: string[];
  production_time?: number | null;
  is_popular?: boolean | null;
  category_ids: number[];
}

export const revalidate = 60;
export const dynamic = 'force-static';
export const runtime = 'edge';           // ← новая строка

/* ------------------------ базовые мета-данные ------------------------- */
export const metadata: Metadata = {
  title: 'KEY TO HEART – клубничные букеты с доставкой в Краснодаре',
  description:
    'Клубничные букеты, цветы и подарки с доставкой по Краснодару и до 20 км за 60 мин. Свежесть гарантируем, фото заказа перед отправкой.',
  keywords: [
    'доставка клубничных букетов Краснодар',
    'купить букет из клубники Краснодар',
    'доставка цветов Краснодар',
    'букет на день рождения Краснодар',
    'клубничные букеты 60 минут',
  ],
  openGraph: {
    title: 'KEY TO HEART – клубничные букеты с доставкой',
    description:
      'Закажите клубничные букеты и цветы с доставкой 60 мин по Краснодару и до 20 км.',
    url: 'https://keytoheart.ru',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничные букеты KEY TO HEART',
      },
      {
        url: 'https://keytoheart.ru/og-bouquet.webp',
        width: 1200,
        height: 630,
        alt: 'Цветы с доставкой в Краснодаре',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KEY TO HEART – клубничные букеты в Краснодаре',
    description:
      'Свежие клубничные букеты и цветы с доставкой за 60 мин по Краснодару и до 20 км.',
    images: [
      'https://keytoheart.ru/og-cover.webp',
      'https://keytoheart.ru/og-bouquet.webp',
    ],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
};

/* ------------------------------ Страница ------------------------------ */
export default async function Home() {
  /* ------------------ Подключаемся к Supabase ------------------ */
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  /* ------------------ Грузим товары и категории ------------------ */
  const productCategories = await supabase
    .from('product_categories')
    .select('product_id, category_id');

  const productCategoriesMap = new Map<number, number[]>();
  productCategories.data?.forEach(({ product_id, category_id }) => {
    const list = productCategoriesMap.get(product_id) || [];
    productCategoriesMap.set(product_id, [...list, category_id]);
  });
  const productIds = [...productCategoriesMap.keys()];

  const { data: productsRaw } = await supabase
    .from('products')
    .select(
      'id,title,price,discount_percent,in_stock,images,production_time,is_popular',
    )
    .in('id', productIds.length ? productIds : [-1])
    .eq('in_stock', true)
    .not('images', 'is', null)
    .order('id', { ascending: false });

  /* === TS-FIX №1: null-safety === */
  const products: Product[] = (productsRaw ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    discount_percent: p.discount_percent ?? null,
    in_stock: p.in_stock ?? false,
    images: p.images ?? [],
    production_time: p.production_time ?? null,
    is_popular: p.is_popular ?? null,
    category_ids: productCategoriesMap.get(p.id) || [],
  }));

  const categoryIds = [...new Set(products.flatMap((p) => p.category_ids))];
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id,name,slug')
    .in('id', categoryIds.length ? categoryIds : [-1]);

  /* === TS-FIX №2: null-safety === */
  const categoryMap = new Map<
    number,
    { name: string; slug: string }
  >((categoriesData ?? []).map((c) => [c.id, { name: c.name, slug: c.slug }]));

  /* ----------------- Список категорий для блока ----------------- */
  const ignoreSlugs = new Set(['balloon', 'postcard']);
  const categories = [
    ...new Set(
      products
        .filter(
          (p) =>
            !p.category_ids.some((id) =>
              ignoreSlugs.has(categoryMap.get(id)?.slug || ''),
            ),
        )
        .flatMap((p) => p.category_ids.map((id) => categoryMap.get(id)?.name)),
    ),
  ].filter(Boolean) as string[];

  const slugMap: Record<string, string> = {
    'Клубничные букеты': 'klubnichnye-bukety',
    'Клубничные боксы': 'klubnichnye-boksy',
    Цветы: 'flowers',
    'Комбо-наборы': 'combo',
    Premium: 'premium',
    Коллекции: 'kollekcii',
    Повод: 'povod',
    Подарки: 'podarki',
  };

  /* ----------------------- JSON-LD @graph ----------------------- */
  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  const ldGraph = [
    {
      '@id': 'https://keytoheart.ru/#home',
      '@type': 'WebPage',
      name: 'KEY TO HEART – клубничные букеты в Краснодаре',
      url: 'https://keytoheart.ru',
      description:
        'Клубничные букеты, цветы и подарки с доставкой по Краснодару за 60 мин.',
      inLanguage: 'ru',
    } satisfies WebPage,
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Главная',
          item: 'https://keytoheart.ru',
        },
      ],
    } satisfies BreadcrumbList,
    {
      '@type': 'ItemList',
      itemListOrder: 'http://schema.org/ItemListOrderAscending',
      itemListElement: products.slice(0, 12).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.title,
          url: `https://keytoheart.ru/product/${p.id}`,
          image: p.images[0],
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'RUB',
            priceValidUntil: priceValidUntil.toISOString().split('T')[0],
            availability: p.in_stock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        },
      })),
    } satisfies ItemList,
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Сколько хранится клубничный букет?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'При температуре 4 °C клубничные букеты сохраняют свежесть до 24 часов.',
          },
        },
        {
          '@type': 'Question',
          name: 'Доставляете ли вы ночью?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да. Ночная доставка возможна по договорённости с менеджером при оформлении заказа днём.',
          },
        },
        {
          '@type': 'Question',
          name: 'Как быстро доставите букет?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Стандартное время доставки — от 60 минут по Краснодару и до 20 км вокруг.',
          },
        },
      ],
    } satisfies FAQPage,
  ];

  /* ------------------------------ Render ------------------------------ */
  return (
    <main aria-label="Главная страница">
      <JsonLd<{ '@graph': unknown[] }> item={{ '@graph': ldGraph }} />

      {/* главный заголовок (визуально скрыт, но семантически важен) */}
      <h1 className="sr-only">
        KEY TO HEART – клубничные букеты и цветы с доставкой в Краснодаре
      </h1>

      <section>
        <PromoGridServer />
      </section>

      <Suspense fallback={null}>
        <section>
          <PopularProductsServer />
        </section>
      </Suspense>

      <section aria-label="Категории товаров">
        {products.length === 0 ? (
          <div className="mx-auto my-12 grid max-w-7xl grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          categories.map((category, idx) => {
            const slug = slugMap[category] || '';
            const items = products
              .filter((p) =>
                p.category_ids.some(
                  (id) => categoryMap.get(id)?.name === category,
                ),
              )
              .slice(0, 8);

            return (
              <React.Fragment key={category}>
                <CategoryPreviewServer
                  categoryName={category}
                  products={items}
                  seeMoreLink={slug}
                  headingId={`category-preview-${slug || idx}`}
                />
                {idx === 0 && <AdvantagesClient />}
              </React.Fragment>
            );
          })
        )}
      </section>
    </main>
  );
}
