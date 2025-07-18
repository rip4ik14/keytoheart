/* -------------------------------------------------------------------------- */
/*  Главная страница (SEO boost + Edge runtime + FAQ)                         */
/*  Версия: 2025‑07‑18 — усилены УТП + кластер “комбо‑наборы”                 */
/* -------------------------------------------------------------------------- */

import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList, FAQPage, WebPage, BreadcrumbList } from 'schema-dts';

import PromoGridServer       from '@components/PromoGridServer';
import AdvantagesClient      from '@components/AdvantagesClient';
import PopularProductsServer from '@components/PopularProductsServer';
import CategoryPreviewServer from '@components/CategoryPreviewServer';
import SkeletonCard          from '@components/ProductCardSkeleton';
import FAQSectionWrapper     from '@components/FAQSectionWrapper';
import YandexReviewsWidget   from '@components/YandexReviewsWidget';

import { createServerClient }  from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import type { Database }       from '@/lib/supabase/types_new';

/* ----------------------------- FAQ (единый источник) ----------------------------- */
const faqList = [
  {
    question: 'Какую клубнику вы используете в букетах и наборах?',
    answer:
      'Мы используем свежую местную и импортную ягоду в зависимости от сезона — вкус остаётся на высоте в любое время года. Каждая ягода проходит тщательный ручной отбор — в букеты попадает только идеальная клубника.',
  },
  {
    question: 'Какой шоколад вы используете?',
    answer:
      'Только премиальный бельгийский шоколад Callebaut: молочный, белый без привкуса какао и тёмный с ярким вкусом какао. Никаких заменителей и глазури.',
  },
  {
    question: 'Как работает программа лояльности?',
    answer:
      'За каждый заказ вы получаете от 2,5 % до 15 % бонусами. 1 балл = 1 ₽, их можно использовать при следующих покупках. Дарим 1000 баллов за первый заказ.',
  },
  {
    question: 'Можно ли оформить заказ в день покупки?',
    answer:
      'Да, мы доставим ваш заказ от 60 минут — чтобы порадовать вас и ваших близких без ожидания.',
  },
];

const faqEntities: FAQPage['mainEntity'] = faqList.map((f) => ({
  '@type': 'Question',
  name: f.question,
  acceptedAnswer: { '@type': 'Answer', text: f.answer },
}));

/* --------------------------------- Типы --------------------------------- */
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

/* -------------------------- ISR / Edge flags ---------------------------- */
export const revalidate = 300;
export const dynamic   = 'force-static';

/* --------------------------- Метаданные -------------------------------- */
export const metadata: Metadata = {
  title: 'KEY TO HEART – клубника в шоколаде, цветы и комбо‑наборы с доставкой в Краснодаре',
  description:
    'Клубника в шоколаде, клубничные букеты, цветы и комбо‑наборы с доставкой по Краснодару и до 20 км за 60 минут. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой, бесплатная открытка и удобная оплата онлайн.',
  openGraph: {
    title: 'KEY TO HEART – клубника в шоколаде, цветы и комбо‑наборы',
    description:
      'Закажите клубнику в шоколаде, цветы и комбо‑наборы с доставкой 60 мин по Краснодару и до 20 км. Фото перед отправкой, бесплатная открытка, оплата онлайн.',
    url: 'https://keytoheart.ru',
    images: [
      { url: 'https://keytoheart.ru/og-cover.webp',  width: 1200, height: 630, alt: 'Клубника в шоколаде – KEY TO HEART' },
      { url: 'https://keytoheart.ru/og-bouquet.webp', width: 1200, height: 630, alt: 'Клубничный букет – KEY TO HEART' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KEY TO HEART – клубника в шоколаде и цветы в Краснодаре',
    description:
      'Свежая клубника в шоколаде, букеты и цветы с доставкой за 60 мин по Краснодару. Бесплатная открытка в подарок, оплата онлайн.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
};

/* ==============================  Страница  ============================== */
export default async function Home() {
  /* ------------------------ Supabase (SSR) ------------------------ */
  const cookieStore = await getCookies();
  const cookiesArr  = cookieStore.getAll();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          cookiesArr.map((c) => ({ name: c.name, value: c.value })),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          ),
      },
    },
  );

  /* ---------- Параллельные запросы: продукты + связи ---------- */
  const [{ data: pc }, { data: pr }] = await Promise.all([
    supabase.from('product_categories').select('product_id, category_id'),
    supabase
      .from('products')
      .select(
        'id,title,price,discount_percent,in_stock,images,production_time,is_popular',
      )
      .eq('in_stock', true)
      .not('images', 'is', null)
      .order('id', { ascending: false }),
  ]);

  /* -------- product_id → [category_id,…] Map -------- */
  const pcMap = new Map<number, number[]>();
  pc?.forEach(({ product_id, category_id }) => {
    const arr = pcMap.get(product_id) || [];
    pcMap.set(product_id, [...arr, category_id]);
  });

  /* ---------------------- Продукты ---------------------- */
  const products: Product[] = (pr ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    discount_percent: p.discount_percent ?? null,
    in_stock: p.in_stock ?? false,
    images: p.images ?? [],
    production_time: p.production_time ?? null,
    is_popular: p.is_popular ?? null,
    category_ids: pcMap.get(p.id) || [],
  }));

  /* ---------------------- Категории --------------------- */
  const uniqueCatIds = [...new Set(products.flatMap((p) => p.category_ids))];

  const { data: cat } = await supabase
    .from('categories')
    .select('id,name,slug')
    .in('id', uniqueCatIds.length ? uniqueCatIds : [-1]);

  const catMap = new Map<number, { name: string; slug: string }>(
    (cat ?? []).map((c) => [c.id, { name: c.name, slug: c.slug }]),
  );

  /* ------------- Категории для витрины ------------- */
  const IGNORE_SLUGS = new Set(['balloon', 'postcard']);
  const categories = [
    ...new Set(
      products
        .filter(
          (p) =>
            !p.category_ids.some((id) =>
              IGNORE_SLUGS.has(catMap.get(id)?.slug || ''),
            ),
        )
        .flatMap((p) => p.category_ids.map((id) => catMap.get(id)?.name)),
    ),
  ].filter(Boolean) as string[];

  /* ------------- slug ↔ name маппинг ------------- */
  const slugMap: Record<string, string> = {
    'Клубничные букеты': 'klubnichnye-bukety',
    'Клубничные боксы':  'klubnichnye-boksy',
    Цветы:               'flowers',
    'Комбо-наборы':      'combo',
    Premium:             'premium',
    Коллекции:           'kollekcii',
    Повод:               'povod',
    Подарки:             'podarki',
  };

  /* ------------------- JSON-LD graph ------------------- */
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const ldGraph: Array<WebPage | BreadcrumbList | ItemList | FAQPage> = [
    {
      '@id': 'https://keytoheart.ru/#home',
      '@type': 'WebPage',
      name: metadata.title as string,
      url:  'https://keytoheart.ru',
      description: metadata.description as string,
      inLanguage: 'ru',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://keytoheart.ru' },
      ],
    },
    {
      '@type': 'ItemList',
      itemListOrder: 'http://schema.org/ItemListOrderAscending',
      itemListElement: products.slice(0, 12).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.title,
          url:  `https://keytoheart.ru/product/${p.id}`,
          image: p.images[0],
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'RUB',
            priceValidUntil: validUntil.toISOString().split('T')[0],
            availability: p.in_stock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        },
      })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqEntities,
    },
  ];

  /* ------------------------- Render ------------------------- */
  return (
    <main aria-label="Главная страница">
      <JsonLd<{ '@graph': unknown[] }> item={{ '@graph': ldGraph }} />

      {/* Главный заголовок (скрыт визуально) */}
      <h1 className="sr-only">
        KEY TO HEART – клубника в шоколаде, букеты, цветы и комбо‑наборы с доставкой в Краснодаре
      </h1>

      {/* Промо-баннер / hero */}
      <section role="region" aria-label="Промо-баннер">
        <PromoGridServer />
      </section>

      {/* Популярные товары — отложенная загрузка */}
      <Suspense fallback={null}>
        <section role="region" aria-label="Популярные товары">
          <PopularProductsServer />
        </section>
      </Suspense>

      {/* Категории товаров */}
      <section
        role="region"
        aria-label="Категории товаров"
        id="home-categories"
      >
        {products.length === 0 ? (
          <div className="mx-auto my-12 grid max-w-7xl grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          categories.slice(0, 4).map((catName, idx) => {
            const slug  = slugMap[catName] || '';
            const items = products
              .filter((p) =>
                p.category_ids.some(
                  (id) => catMap.get(id)?.name === catName,
                ),
              )
              .slice(0, 8);

            const headingId = `category-preview-${slug || idx}`;

            return (
              <React.Fragment key={catName}>
                <CategoryPreviewServer
                  categoryName={catName}
                  products={items}
                  seeMoreLink={slug}
                  headingId={headingId}
                />
                {idx === 0 && <AdvantagesClient />}
              </React.Fragment>
            );
          })
        )}
      </section>

      {/* Вставляем блок отзывов Яндекс */}
      <YandexReviewsWidget />

      {/* FAQ — тот же текст, что и в JSON-LD */}
      <FAQSectionWrapper />
    </main>
  );
}
