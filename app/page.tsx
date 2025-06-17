// ✅ Путь: app/page.tsx
import React from 'react'; // <-- обязательно для <React.Fragment>
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList } from 'schema-dts';
import PromoGridServer from '@components/PromoGridServer';
import AdvantagesClient from '@components/AdvantagesClient'; // <-- импорт Client версии
import PopularProductsServer from '@components/PopularProductsServer';
import CategoryPreviewServer from '@components/CategoryPreviewServer';
import SkeletonCard from '@components/ProductCardSkeleton';
import { prisma } from '@/lib/prisma';

// Обновлённый тип Product
interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent: number | null;
  in_stock: boolean;
  is_popular: boolean;
  images: string[];
  production_time: number | null;
  category_ids: number[];
}

export const revalidate = 60;
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'KEY TO HEART — Клубничные букеты и подарки в Краснодаре',
  description: 'Свежие цветы, клубничные букеты и подарочные боксы с доставкой по Краснодару.',
  keywords: ['клубничные букеты', 'цветы Краснодар', 'доставка подарков'],
  openGraph: {
    title: 'KEY TO HEART — Клубничные букеты и подарки',
    description: 'Закажите уникальные композиции с доставкой по Краснодару.',
    url: 'https://keytoheart.ru',
    images: [{ url: '/og-cover.webp', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
};

export default async function Home() {

  let products: Product[] = [];
  const categoryMap = new Map<number, { name: string; slug: string }>();
  try {
    const data = await prisma.products.findMany({
      where: { in_stock: true, is_visible: true },
      orderBy: { id: 'desc' },
      include: {
        product_categories: {
          select: {
            category_id: true,
            categories: {
              select: { name: true, slug: true },
            },
          },
        },
      },
    });

    products = data.map((item) => {
      const categoryIds: number[] = [];
      item.product_categories.forEach((pc) => {
        categoryIds.push(pc.category_id);
        if (pc.categories) {
          categoryMap.set(pc.category_id, {
            name: pc.categories.name,
            slug: pc.categories.slug,
          });
        }
      });

      return {
        id: item.id,
        title: item.title,
        price: item.price,
        discount_percent: item.discount_percent ?? null,
        in_stock: item.in_stock ?? false,
        is_popular: item.is_popular ?? false,
        images: item.images ?? [],
        production_time: item.production_time ?? null,
        category_ids: categoryIds,
      } as Product;
    });
  } catch (err) {
    process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки товаров:', err);
  }

  // Фильтруем категории, исключая "Подарки"
  const categories = Array.from(
    new Set(
      products
        .filter((p) => !p.category_ids.some(id => {
          const category = categoryMap.get(id);
          return category?.slug === 'balloon' || category?.slug === 'postcard';
        }))
        .flatMap((p) => p.category_ids.map(id => categoryMap.get(id)?.name))
    )
  )
    .filter(Boolean)
    .filter((category) => category !== 'Подарки') as string[];

  return (
    <main aria-label="Главная страница">
      {/* Schema.org для товаров */}
      <JsonLd<ItemList>
        item={{
          '@type': 'ItemList',
          itemListElement: products
            .filter((p) => p.images && p.images.length > 0)
            .map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Product',
                name: p.title,
                url: `https://keytoheart.ru/product/${p.id}`,
                image: p.images && p.images.length > 0 ? p.images[0] : '',
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
      <section>
        <PromoGridServer />
      </section>
      <section>
        <PopularProductsServer />
      </section>
      {/* AdvantagesServer убираем если используем AdvantagesClient */}
      <section aria-label="Категории товаров">
        {products.length === 0 ? (
          <div className="mx-auto my-12 grid max-w-7xl grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          categories.map((category, idx) => {
            const slug = Array.from(categoryMap.values()).find(
              (c) => c.name === category
            )?.slug || '';
            const items = products
              .filter((p) => p.category_ids.some(id => categoryMap.get(id)?.name === category))
              .slice(0, 8);

            return (
              <React.Fragment key={category}>
                <CategoryPreviewServer
                  categoryName={category}
                  products={items}
                  seeMoreLink={slug}
                  headingId={`category-preview-${slug || idx}`}
                />
                {/* Преимущества после первой категории */}
                {idx === 0 && <AdvantagesClient />}
              </React.Fragment>
            );
          })
        )}
      </section>
    </main>
  );
}
