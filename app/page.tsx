/* -------------------------------------------------------------------------- */
/*  Главная страница. Добавлены FAQ-разметка и SEO-штрихи, снижена тошнота     */
/* -------------------------------------------------------------------------- */
'use client';

import React from 'react';
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList, FAQPage } from 'schema-dts';
import PromoGridServer from '@components/PromoGridServer';
import AdvantagesClient from '@components/AdvantagesClient';
import PopularProductsServer from '@components/PopularProductsServer';
import CategoryPreviewServer from '@components/CategoryPreviewServer';
import SkeletonCard from '@components/ProductCardSkeleton';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';

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

export const metadata: Metadata = {
  title: 'Клубничные букеты за 60 мин по Краснодару | KEY TO HEART',
  description:
    'Свежие клубничные букеты, цветы и подарки — доставка по Краснодару за 60 минут. Работаем 24/7. Гарантия качества и фото перед отправкой.',
  keywords:
    'доставка клубники в шоколаде, клубничные букеты Краснодар, подарки Краснодар, срочная доставка, заказать клубнику',
  openGraph: {
    title: 'Клубничные букеты и подарки в Краснодаре | KEY TO HEART',
    description: 'Сюрприз за час! Доставка букетов и подарков 24/7 по Краснодару.',
    url: 'https://keytoheart.ru',
    images: [{ url: '/og-cover.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Клубничные букеты и подарки в Краснодаре | KEY TO HEART',
    description: 'Свежие клубничные букеты и цветы с доставкой 24/7 за 60 мин.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
};

export default async function Home() {
  // Читаем куки
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const raw = cookieStore.getAll();
          return raw.map((cookie: any) => ({ name: cookie.name, value: cookie.value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((c: any) => {
            cookieStore.set(c.name, c.value, c.options);
          });
        },
      },
    }
  );

  let products: Product[] = [];
  try {
    // Загружаем связи товаров и категорий
    const { data: productCategoryData, error: productCategoryError } = await supabase
      .from('product_categories')
      .select('product_id, category_id');
    if (productCategoryError) throw productCategoryError;
    const productCategoriesMap = new Map<number, number[]>();
    productCategoryData.forEach(({ product_id, category_id }) => {
      const list = productCategoriesMap.get(product_id) || [];
      productCategoriesMap.set(product_id, [...list, category_id]);
    });
    const productIds = [...productCategoriesMap.keys()];

    // Загружаем товары
    const { data, error } = await supabase
      .from('products')
      .select('id,title,price,discount_percent,in_stock,images,production_time,is_popular')
      .in('id', productIds.length ? productIds : [-1])
      .eq('in_stock', true)
      .not('images', 'is', null)
      .order('id', { ascending: false });
    if (error) throw error;
    products =
      data?.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        discount_percent: item.discount_percent ?? null,
        in_stock: item.in_stock ?? false,
        images: item.images ?? [],
        production_time: item.production_time ?? null,
        is_popular: item.is_popular ?? null,
        category_ids: productCategoriesMap.get(item.id) || [],
      })) || [];
  } catch (err) {
    console.error('Ошибка загрузки товаров:', err);
  }

  // Загружаем категории одним запросом
  const categoryIds = [...new Set(products.flatMap((p) => p.category_ids))];
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('id,name,slug')
    .in('id', categoryIds.length ? categoryIds : [-1]);
  if (categoriesError) console.error('Ошибка загрузки категорий:', categoriesError);
  const categoryMap = new Map<number, { name: string; slug: string }>();
  categoriesData?.forEach((c) => categoryMap.set(c.id, { name: c.name, slug: c.slug }));

  // Сопоставление имён для UI
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

  const categories = [...new Set(
    products
      .flatMap((p) => p.category_ids.map((id) => categoryMap.get(id)?.name))
  )]
    .filter(Boolean)
    .filter((name) => name !== 'Подарки') as string[];

  return (
    <main aria-label="Главная страница">
      {/* JSON-LD для списка товаров */}
      <JsonLd<ItemList>
        item={{
          '@type': 'ItemList',
          itemListElement: products.map((p, i) => ({
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

      {/* FAQ */}
      <JsonLd<FAQPage>
        item={{
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Сколько хранится клубничный букет?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Свежий букет хранится до 24 часов при +4°C.',
              },
            },
            {
              '@type': 'Question',
              name: 'Работаете ли ночью?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Да, доставка круглосуточно 24/7.',
              },
            },
          ],
        }}
      />

      <section><PromoGridServer /></section>
      <section><PopularProductsServer /></section>

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
            const items = products.filter((p) =>
              p.category_ids.some((id) => categoryMap.get(id)?.name === category)
            ).slice(0, 8);
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
