// ✅ Путь: app/page.tsx
import React from 'react'; // <-- обязательно для <React.Fragment>
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList } from 'schema-dts';
import PromoGrid from '@components/PromoGrid';
import AdvantagesClient from '@components/AdvantagesClient'; // <-- импорт Client версии
import PopularProducts from '@components/PopularProducts';
import CategoryPreviewServer from '@components/CategoryPreviewServer';
import SkeletonCard from '@components/ProductCardSkeleton';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';

// Обновлённый тип Product
interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent: number | null;
  in_stock: boolean;
  images: string[];
  category_ids: number[];
}

export const revalidate = 60;
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'KeyToHeart — Клубничные букеты и подарки в Краснодаре',
  description: 'Свежие цветы, клубничные букеты и подарочные боксы с доставкой по Краснодару.',
  keywords: ['клубничные букеты', 'цветы Краснодар', 'доставка подарков'],
  openGraph: {
    title: 'KeyToHeart — Клубничные букеты и подарки',
    description: 'Закажите уникальные композиции с доставкой по Краснодару.',
    url: 'https://keytoheart.ru',
    images: [{ url: '/og-cover.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
};

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  let products: Product[] = [];
  try {
    // Получаем связи товаров с категориями
    const { data: productCategoryData, error: productCategoryError } = await supabase
      .from('product_categories')
      .select('product_id, category_id');

    if (productCategoryError) {
      throw new Error(`Ошибка загрузки связей категорий: ${productCategoryError.message}`);
    }

    // Группируем category_ids по product_id
    const productCategoriesMap = new Map<number, number[]>();
    productCategoryData.forEach(item => {
      const existing = productCategoriesMap.get(item.product_id) || [];
      productCategoriesMap.set(item.product_id, [...existing, item.category_id]);
    });

    const productIds = Array.from(productCategoriesMap.keys());

    // Получаем товары
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        discount_percent,
        in_stock,
        images
      `)
      .in('id', productIds.length > 0 ? productIds : [0]) // Избегаем пустого IN
      .eq('in_stock', true)
      .not('images', 'is', null)
      .order('id', { ascending: false });

    if (error) throw new Error(`Ошибка загрузки товаров: ${error.message}`);

    products = data
      ? data.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          discount_percent: item.discount_percent ?? null,
          in_stock: item.in_stock ?? false,
          images: item.images ?? [],
          category_ids: productCategoriesMap.get(item.id) || [],
        }))
      : [];
  } catch (err) {
    process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки товаров:', err);
  }

  // Получаем названия категорий
  const categoryIds = Array.from(new Set(products.flatMap(p => p.category_ids)));
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, slug')
    .in('id', categoryIds.length > 0 ? categoryIds : [0]); // Избегаем пустого IN

  if (categoriesError) {
    process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки категорий:', categoriesError);
  }

  const categoryMap = new Map<number, { name: string; slug: string }>();
  categoriesData?.forEach(category => {
    categoryMap.set(category.id, { name: category.name, slug: category.slug });
  });

  const slugMap: Record<string, string> = {
    'Клубничные букеты': 'klubnichnye-bukety',
    'Клубничные боксы': 'klubnichnye-boksy',
    'Цветы': 'flowers',
    'Комбо-наборы': 'combo',
    'Premium': 'premium',
    'Коллекции': 'kollekcii',
    'Повод': 'povod',
    'Подарки': 'podarki',
  };

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
        <PromoGrid />
      </section>
      <section>
        <PopularProducts />
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
            const slug = slugMap[category] || '';
            const items = products
              .filter((p) => p.category_ids.some(id => categoryMap.get(id)?.name === category))
              .slice(0, 8);

            return (
              <React.Fragment key={category}>
                <CategoryPreviewServer
                  categoryName={category}
                  products={items}
                  seeMoreLink={slug}
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
