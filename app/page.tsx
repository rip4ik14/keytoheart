/* -------------------------------------------------------------------------- */
/*  Главная страница (SEO boost + Edge runtime + FAQ)                         */
/* -------------------------------------------------------------------------- */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type {
  ItemList,
  FAQPage,
  WebPage,
  BreadcrumbList,
  Organization,
} from 'schema-dts';

import PromoGridServer from '@components/PromoGridServer';
import PopularProductsServer from '@components/PopularProductsServer';
import CategoryPreviewServer from '@components/CategoryPreviewServer';
import SkeletonCard from '@components/ProductCardSkeleton';
import AdvantagesClient from '@components/AdvantagesClient';
import YandexReviewsWidget from '@components/YandexReviewsWidget';
import FAQSectionWrapper from '@components/FAQSectionWrapper';
import FlowwowReviewsWidget from '@components/FlowwowReviewsWidget';

import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';

/* ----------------------------- FAQ (единый источник) ----------------------------- */
const faqList = [
  {
    question: 'Какую клубнику вы используете в букетах и наборах?',
    answer:
      'Мы используем свежую местную и импортную ягоду в зависимости от сезона - вкус остаётся на высоте в любое время года. Каждая ягода проходит тщательный ручной отбор - в букеты попадает только идеальная клубника.',
  },
  {
    question: 'Какой шоколад вы используете?',
    answer:
      'Только премиальный бельгийский шоколад Callebaut: молочный, белый без привкуса какао и тёмный с ярким вкусом какао. Никаких заменителей и глазури.',
  },
  {
    question: 'Как работает программа лояльности?',
    answer:
      'За каждый заказ вы получаете от 2,5 % до 15 % бонусами. 1 балл = 1 ₽, их можно использовать при следующих покупках. Дарим 1000 баллов за первый заказ.',
  },
  {
    question: 'Можно ли оформить заказ в день покупки?',
    answer:
      'Да, мы доставим ваш заказ от 60 минут - чтобы порадовать вас и ваших близких без ожидания.',
  },
];

const faqEntities: FAQPage['mainEntity'] = faqList.map((f) => ({
  '@type': 'Question',
  name: f.question,
  acceptedAnswer: { '@type': 'Answer', text: f.answer },
}));

const REQUEST_TIMEOUT = 8000;

async function withTimeout<T>(
  promise: Promise<T> | PromiseLike<T>,
  timeoutMs = REQUEST_TIMEOUT,
): Promise<T> {
  const wrappedPromise = Promise.resolve(promise);

  return Promise.race<T>([
    wrappedPromise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timed out fetching data')), timeoutMs),
    ),
  ]);
}

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

interface CategoryMeta {
  id: number;
  name: string;
  slug: string;
  count: number;
}

/* -------------------------- ISR / Edge flags ---------------------------- */
export const revalidate = 300;

/* --------------------------- Метаданные -------------------------------- */
export const metadata: Metadata = {
  title:
    'Клубника в шоколаде, цветы и комбо-наборы с доставкой в Краснодаре',
  description:
    'Клубника в шоколаде, клубничные букеты, цветы и комбо-наборы с доставкой по Краснодару и до 20 км за 60 минут. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой, бесплатная открытка и удобная оплата онлайн.',
  openGraph: {
    title: 'KEY TO HEART - клубника в шоколаде, цветы и комбо-наборы',
    description:
      'Закажите клубнику в шоколаде, цветы и комбо-наборы с доставкой 60 мин по Краснодару и до 20 км. Фото перед отправкой, бесплатная открытка, оплата онлайн.',
    url: 'https://keytoheart.ru',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубника в шоколаде - KEY TO HEART',
      },
      {
        url: 'https://keytoheart.ru/og-bouquet.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничный букет - KEY TO HEART',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KEY TO HEART - клубника в шоколаде и цветы в Краснодаре',
    description:
      'Свежая клубника в шоколаде, букеты и цветы с доставкой за 60 мин по Краснодару. Бесплатная открытка в подарок, оплата онлайн.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
};

/* ---------------------- JSON-LD генератор ---------------------- */
function buildLdGraph(
  products: Product[],
): Array<WebPage | BreadcrumbList | ItemList | FAQPage | Organization> {
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const itemList: ItemList = {
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
          priceValidUntil: validUntil.toISOString().split('T')[0],
          availability: p.in_stock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      },
    })),
  };

  const webPage: WebPage = {
    '@id': 'https://keytoheart.ru/#home',
    '@type': 'WebPage',
    name: 'KEY TO HEART - клубника в шоколаде, цветы и комбо-наборы с доставкой в Краснодаре',
    url: 'https://keytoheart.ru',
    description:
      'Клубника в шоколаде, клубничные букеты, цветы и комбо-наборы с доставкой по Краснодару и до 20 км за 60 минут. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой, бесплатная открытка и удобная оплата онлайн.',
    inLanguage: 'ru',
  };

  const breadcrumbs: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: 'https://keytoheart.ru',
      },
    ],
  };

  const faqPage: FAQPage = {
    '@type': 'FAQPage',
    mainEntity: faqEntities,
  };

  // Важно: рейтинг привязываем к внешнему источнику через sameAs (Flowwow).
  // Это честно и не выглядит как "отзывы на нашем сайте".
  const org: Organization = {
    '@type': 'Organization',
    name: 'KEY TO HEART',
    url: 'https://keytoheart.ru',
    sameAs: ['https://flowwow.com/shop/key-to-heart/'],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.93,
      bestRating: 5,
      worstRating: 1,
      // lower bound: "более 2800" -> в JSON-LD используем 2800
      ratingCount: 2800,
    },
  };

  return [webPage, breadcrumbs, itemList, faqPage, org];
}

/* ==============================  Страница  ============================== */
export default async function Home() {
  /* ------------------------ Supabase (SSR) ------------------------ */
  const cookieStore = await getCookies();
  const cookiesArr = cookieStore.getAll();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookiesArr.map((c) => ({ name: c.name, value: c.value })),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          ),
      },
    },
  );

  /* ---------- Параллельные запросы: продукты + связи ---------- */
  let pcSafe: { product_id: number; category_id: number }[] = [];
  let prSafe: any[] = [];

  try {
    const [{ data: pc, error: pcError }, { data: pr, error: prError }] =
      await Promise.all([
        withTimeout(
          supabase.from('product_categories').select('product_id, category_id'),
        ),
        withTimeout(
          supabase
            .from('products')
            .select(
              'id,title,price,discount_percent,in_stock,images,production_time,is_popular',
            )
            .eq('in_stock', true)
            .not('images', 'is', null)
            .order('is_popular', { ascending: false })
            .order('id', { ascending: false })
            .limit(120),
        ),
      ]);

    if (pcError) throw new Error(pcError.message);
    if (prError) throw new Error(prError.message);

    pcSafe = pc ?? [];
    prSafe = pr ?? [];
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[home] products fetch failed ->', error);
    }
  }

  /* -------- product_id -> [category_id,…] Map -------- */
  const pcMap = new Map<number, number[]>();
  pcSafe.forEach(({ product_id, category_id }) => {
    const arr = pcMap.get(product_id) || [];
    pcMap.set(product_id, [...arr, category_id]);
  });

  /* ---------------------- Продукты ---------------------- */
  const products: Product[] = prSafe.map((p) => ({
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

  let catSafe: { id: number; name: string; slug: string }[] = [];

  if (uniqueCatIds.length) {
    try {
      const { data: cat, error: catError } = await withTimeout(
        supabase
          .from('categories')
          .select('id,name,slug')
          .in('id', uniqueCatIds.length ? uniqueCatIds : [-1]),
      );

      if (catError) throw new Error(catError.message);
      catSafe = cat ?? [];
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[home] categories fetch failed ->', error);
      }
    }
  }

  const catMap = new Map<number, { name: string; slug: string }>(
    catSafe.map((c) => [c.id, { name: c.name, slug: c.slug }]),
  );

  const IGNORE_SLUGS = new Set([
    'podarki',
    'myagkie-igrushki',
    'vazy',
    'cards',
    'balloons',
  ]);

  const PRIORITY_SLUGS = ['klubnika-v-shokolade', 'flowers', 'combo'];

  const MIN_PRODUCTS_PER_CATEGORY = 2;

  const categoryCounts = new Map<number, number>();
  products.forEach((p) => {
    p.category_ids.forEach((id) => {
      const slug = catMap.get(id)?.slug;
      if (!slug || IGNORE_SLUGS.has(slug)) return;
      categoryCounts.set(id, (categoryCounts.get(id) ?? 0) + 1);
    });
  });

  const categoryMetaAll: CategoryMeta[] = [...categoryCounts.entries()]
    .map(([id, count]) => {
      const catEntry = catMap.get(id);
      if (!catEntry) return null;
      return {
        id,
        name: catEntry.name,
        slug: catEntry.slug,
        count,
      };
    })
    .filter((c): c is CategoryMeta => !!c && c.count >= MIN_PRODUCTS_PER_CATEGORY);

  categoryMetaAll.sort((a, b) => {
    const ai = PRIORITY_SLUGS.indexOf(a.slug);
    const bi = PRIORITY_SLUGS.indexOf(b.slug);

    const aPriority = ai === -1 ? Infinity : ai;
    const bPriority = bi === -1 ? Infinity : bi;

    if (aPriority !== bPriority) return aPriority - bPriority;

    if (aPriority === Infinity && bPriority === Infinity) {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, 'ru');
    }

    return 0;
  });

  const categoriesMeta = categoryMetaAll;

  /* ------------------- JSON-LD graph ------------------- */
  const ldGraph = buildLdGraph(products);

  return (
    <main aria-label="Главная страница">
      <JsonLd<{ '@graph': unknown[] }> item={{ '@graph': ldGraph }} />

      <h1 className="sr-only sm:not-sr-only text-sm sm:mt-3 sm:mb-2 sm:text-white">
        Клубника в шоколаде, букеты и комбо-наборы с доставкой в Краснодаре
      </h1>

      <section role="region" aria-label="Промо-баннер">
        <PromoGridServer />
      </section>

      <Suspense fallback={null}>
        <section role="region" aria-label="Популярные товары">
          <h2 className="sr-only">Популярные товары</h2>
          <PopularProductsServer />
        </section>
      </Suspense>

      <section role="region" aria-label="Категории товаров" id="home-categories">
        <h2 className="sr-only">Категории товаров</h2>
        {products.length === 0 ? (
          <div className="mx-auto my-12 grid max-w-7xl grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          categoriesMeta.slice(0, 4).map((catMeta, idx) => {
            const { id: catId, name: catName, slug } = catMeta;

            const items = products
              .filter((p) => p.category_ids.includes(catId))
              .slice(0, 8);

            if (items.length === 0) return null;

            const headingId = `category-preview-${slug || idx}`;

            return (
              <React.Fragment key={catId}>
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

      {/* Flowwow (как на Labberry, без картинок) */}
      <section role="region" aria-label="Отзывы Flowwow" className="mt-8 sm:mt-10">
        <h2 className="sr-only">Отзывы на Flowwow</h2>
        <FlowwowReviewsWidget className="" />
      </section>

      {/* Яндекс отзывы */}
      <section role="region" aria-label="Отзывы клиентов" className="mt-8 sm:mt-10">
        <h2 className="sr-only">Отзывы клиентов</h2>
        <YandexReviewsWidget />
      </section>

      <section role="region" aria-label="Вопросы и ответы">
        <h2 className="sr-only">Вопросы и ответы</h2>
        <FAQSectionWrapper />
      </section>
    </main>
  );
}
