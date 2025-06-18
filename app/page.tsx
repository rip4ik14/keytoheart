/* -------------------------------------------------------------------------- */
/*  Главная страница: параллельные запросы, CLS-fix, JSON-LD only when needed */
/* -------------------------------------------------------------------------- */
import React from 'react';
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList, FAQPage } from 'schema-dts';

import PromoGridServer from '@components/PromoGridServer';
import PopularProductsServer from '@components/PopularProductsServer';
import CategoryPreviewServer from '@components/CategoryPreviewServer';
import AdvantagesClient from '@components/AdvantagesClient';
import SkeletonCard from '@components/ProductCardSkeleton';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';

/* ---------------------------- SEO-метаданные ---------------------------- */
export const revalidate = 60;
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Клубничные букеты с доставкой за 60 мин в Краснодаре | KEY TO HEART',
  description:
    'Закажите свежие клубничные букеты, цветы и подарки с доставкой 24/7 за 60 мин по Краснодару!',
  alternates: { canonical: 'https://keytoheart.ru' },
  openGraph: {
    url: 'https://keytoheart.ru',
    title: 'Клубничные букеты и подарки в Краснодаре | KEY TO HEART',
    description: 'Сюрприз за час! Доставка букетов и подарков 24/7 по Краснодару.',
    images: [{ url: '/og-cover.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Клубничные букеты и подарки в Краснодаре | KEY TO HEART',
    description: 'Свежие клубничные букеты и цветы с доставкой 24/7 за 60 мин.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
};

/* --------------------------------- TYPES -------------------------------- */
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

/* -------------------------------- PAGE ---------------------------------- */
export default async function Home() {
  /* ---------- Supabase ---------- */
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: (all) =>
          all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );

  /* ---------- Параллельные запросы к БД ---------- */
  const [{ data: pcData }, { data: prodData }] = await Promise.all([
    supabase.from('product_categories').select('product_id, category_id'),
    supabase
      .from('products')
      .select('id,title,price,discount_percent,in_stock,images,production_time,is_popular')
      .eq('in_stock', true)
      .not('images', 'is', null)
      .order('id', { ascending: false }),
  ]);

  /* ---------- Собираем продукты ---------- */
  const productCategories = new Map<number, number[]>();
  pcData?.forEach(({ product_id, category_id }) => {
    const arr = productCategories.get(product_id) ?? [];
    productCategories.set(product_id, [...arr, category_id]);
  });

  const products: Product[] =
    prodData?.map((p) => ({
      ...p,
      images: p.images ?? [],
      discount_percent: p.discount_percent ?? null,
      production_time: p.production_time ?? null,
      is_popular: p.is_popular ?? null,
      in_stock: !!p.in_stock,                  // ← boolean гарантирован
      category_ids: productCategories.get(p.id) ?? [],
    })) ?? [];

  /* ---------- Загружаем нужные категории одним запросом ---------- */
  const categoryIds = [...new Set(products.flatMap((p) => p.category_ids))];
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id,name,slug')
    .in('id', categoryIds.length ? categoryIds : [-1]);

  const categoryMap = new Map<number, { name: string; slug: string }>();
  categoriesData?.forEach((c) => categoryMap.set(c.id, { name: c.name, slug: c.slug }));

  /* ---------- Категории для превью ---------- */
  const categories = [
    ...new Set(
      products
        .filter(
          (p) => !p.category_ids.some((id) => ['balloon', 'postcard'].includes(categoryMap.get(id)?.slug ?? '')),
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

  /* ------------------------------ RENDER ------------------------------ */
  return (
    <main aria-label="Главная страница">
      {/* ------------- JSON-LD ItemList (если есть изображения) ------------- */}
      {products.some((p) => p.images.length) && (
        <JsonLd<ItemList>
          item={{
            '@type': 'ItemList',
            itemListElement: products
              .filter((p) => p.images.length)
              .map((p, i) => ({
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
                    availability: p.in_stock
                      ? 'https://schema.org/InStock'
                      : 'https://schema.org/OutOfStock',
                  },
                },
              })),
          }}
        />
      )}

      {/* ------------- FAQ для People Also Ask ------------- */}
      <JsonLd<FAQPage>
        item={{
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Сколько хранится клубничный букет?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'При температуре 4 °C свежие клубничные букеты сохраняют вкус и вид до 24 часов.',
              },
            },
            {
              '@type': 'Question',
              name: 'Доставляете ли вы ночью?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Да, если заказ был предварительно заказан днем — доставка возможна в любой час суток.',
              },
            },
          ],
        }}
      />

      {/* ----------------------- Контент ----------------------- */}
      <section>
        <PromoGridServer />
      </section>

      <section>
        <PopularProductsServer />
      </section>

      <section aria-label="Категории товаров">
        {products.length === 0 ? (
          <div
            className="mx-auto my-12 grid max-w-7xl grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4"
            style={{ minHeight: '250px' }} /* резерв высоты = CLS 0 */
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          categories.map((name, idx) => {
            const slug = slugMap[name] ?? '';
            const items = products
              .filter((p) => p.category_ids.some((id) => categoryMap.get(id)?.name === name))
              .slice(0, 8);

            return (
              <React.Fragment key={name}>
                <CategoryPreviewServer
                  categoryName={name}
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
