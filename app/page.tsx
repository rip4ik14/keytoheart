// ✅ Путь: app/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList } from 'schema-dts';

import PromoGridServer       from '@components/PromoGridServer';
import PopularProductsServer from '@components/PopularProductsServer';
import CategoryPreviewServer from '@components/CategoryPreviewServer';
import SkeletonCard          from '@components/ProductCardSkeleton';
import AdvantagesDynamic     from '@components/AdvantagesDynamic';   // ← новая обёртка

import { createServerClient } from '@supabase/ssr';
import { cookies }            from 'next/headers';
import type { Database }      from '@/lib/supabase/types_new';

/* ------------------------------------------------------------------ */
/* types                                                               */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* настройки ISR / SEO                                                 */
/* ------------------------------------------------------------------ */
export const revalidate = 60;
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title:
    'Клубничные букеты и подарки в Краснодаре — KEY TO HEART',
  description:
    'Свежие клубничные букеты, цветы и подарки с доставкой за 60 мин в Краснодаре. Закажите 24/7 на KEY TO HEART для любого случая!',
  keywords: [
    'клубничные букеты Краснодар',
    'доставка цветов Краснодар',
    'подарки с доставкой',
    'заказ цветов онлайн',
  ],
  openGraph: {
    title:
      'Клубничные букеты и подарки в Краснодаре | KEY TO HEART',
    description:
      'Сюрприз для души! Закажите клубничные букеты и цветы с доставкой за 60 мин в Краснодаре.',
    url: 'https://keytoheart.ru',
    images: [
      {
        url: '/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничные букеты KEY TO HEART',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Клубничные букеты в Краснодаре | KEY TO HEART',
    description:
      'Быстрая доставка свежих букетов и подарков в Краснодаре! Заказывайте 24/7 на KEY TO HEART.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
};

/* ------------------------------------------------------------------ */
/* компонент страницы                                                  */
/* ------------------------------------------------------------------ */
export default async function Home() {
  /* --- создаём Supabase-клиент на сервере (с куками) --- */
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
        setAll(arr) {
          arr.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  /* --- загружаем товары и категории --- */
  let products: Product[] = [];
  let categoriesData: { id: number; name: string; slug: string }[] = [];

  try {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        discount_percent,
        in_stock,
        images,
        production_time,
        is_popular,
        product_categories!inner(category_id)
      `)
      .eq('in_stock', true)
      .not('images', 'is', null)
      .order('id', { ascending: false });

    if (productError) throw new Error(productError.message);

    products =
      productData?.map((item) => {
        const categoryIds = item.product_categories.map(
          (pc: { category_id: number }) => pc.category_id,
        );
        return {
          id: item.id,
          title: item.title,
          price: item.price,
          discount_percent: item.discount_percent ?? null,
          in_stock: item.in_stock ?? false,
          images: item.images ?? [],
          production_time: item.production_time ?? null,
          is_popular: item.is_popular ?? null,
          category_ids: categoryIds,
        };
      }) ?? [];

    const uniqueCatIds = Array.from(
      new Set(products.flatMap((p) => p.category_ids)),
    );

    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('id,name,slug')
      .in('id', uniqueCatIds.length ? uniqueCatIds : [0]);

    if (catError) throw new Error(catError.message);
    categoriesData = catData ?? [];
  } catch (e) {
    process.env.NODE_ENV !== 'production' &&
      console.error('Ошибка загрузки данных:', e);
  }

  /* --- мапы для быстрого доступа --- */
  const categoryMap = new Map<number, { name: string; slug: string }>();
  categoriesData.forEach((c) =>
    categoryMap.set(c.id, { name: c.name, slug: c.slug }),
  );

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

  const categories = Array.from(
    new Set(
      products
        .filter(
          (p) =>
            !p.category_ids.some((id) => {
              const c = categoryMap.get(id);
              return c?.slug === 'balloon' || c?.slug === 'postcard';
            }),
        )
        .flatMap((p) =>
          p.category_ids.map((id) => categoryMap.get(id)?.name),
        ),
    ),
  )
    .filter(Boolean)
    .filter((c) => c !== 'Подарки') as string[];

  /* ------------------ JSX ------------------ */
  return (
    <main aria-label="Главная страница">
      {/* JSON-LD каталога */}
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

      {/* Промо-баннеры */}
      <section aria-labelledby="promo-grid-heading">
        <h2 id="promo-grid-heading" className="sr-only">
          Промо-баннеры
        </h2>
        <PromoGridServer />
      </section>

      {/* Популярные */}
      <section aria-labelledby="popular-products-heading">
        <h2 id="popular-products-heading" className="sr-only">
          Популярные товары
        </h2>
        <PopularProductsServer />
      </section>

      {/* Категории с превью */}
      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="sr-only">
          Категории товаров
        </h2>

        {products.length === 0 ? (
          <div className="mx-auto my-12 grid max-w-7xl grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
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

                {/* вставляем блок преимуществ после первой категории */}
                {idx === 0 && <AdvantagesDynamic />}
              </React.Fragment>
            );
          })
        )}
      </section>
    </main>
  );
}
