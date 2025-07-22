/* -------------------------------------------------------------------------- */
/*  Категория (SSR + Supabase + JSON‑LD CollectionPage & Breadcrumb)          */
/*  Версия: slug-only, July 2025                                              */
/* -------------------------------------------------------------------------- */

import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type {
  ItemList,
  BreadcrumbList,
  CollectionPage,
} from 'schema-dts';
import { Suspense } from 'react';
import CategoryPageClient from './CategoryPageClient';
import { redirect } from 'next/navigation';
import type { Tables } from '@/lib/supabase/types_new';

/* ------------------------ SEO‑метаданные страницы ----------------------- */
// (Оставляем только для "цветы" и "комбо" спец-варианты; всё остальное на базе)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;

  // --- Категории со спец-метаданными
  if (slug === 'flowers') {
    return {
      title:
        'Доставка цветов и букетов в Краснодаре — купить онлайн | KEY TO HEART',
      description:
        'Свежие розы, сборные букеты и композиции с доставкой по Краснодару за 60 минут. Фото перед отправкой, бесплатная открытка и удобная оплата онлайн.',
      alternates: { canonical: 'https://keytoheart.ru/category/flowers' },
      openGraph: {
        title: 'Цветы с доставкой в Краснодаре | KEY TO HEART',
        description:
          'Закажите букет цветов онлайн: доставка по Краснодару 60 минут, фото перед отправкой, бесплатная открытка.',
        url: 'https://keytoheart.ru/category/flowers',
        images: [
          {
            url: 'https://keytoheart.ru/og-flowers.webp',
            width: 1200,
            height: 630,
            alt: 'Букет цветов с доставкой — KEY TO HEART',
          },
        ],
      },
      twitter: { card: 'summary_large_image' },
    };
  }

  if (slug === 'combo') {
    return {
      title:
        'Комбо‑наборы: клубника в шоколаде и цветы — доставка в Краснодаре | KEY TO HEART',
      description:
        'Уникальные комбо‑наборы: клубника в бельгийском шоколаде + свежие цветы в одной коробке. Доставка по Краснодару 60 минут, фото перед отправкой, бесплатная открытка, оплата онлайн.',
      alternates: { canonical: 'https://keytoheart.ru/category/combo' },
      openGraph: {
        title: 'Комбо‑наборы «Клубника + Цветы» | KEY TO HEART',
        description:
          'Сладкое и красивое в одном подарке: клубника в шоколаде и цветы. Быстрая доставка по Краснодару.',
        url: 'https://keytoheart.ru/category/combo',
        images: [
          {
            url: 'https://keytoheart.ru/og-combo.webp',
            width: 1200,
            height: 630,
            alt: 'Комбо‑набор клубника и цветы — KEY TO HEART',
          },
        ],
      },
      twitter: { card: 'summary_large_image' },
    };
  }

  // --- Дефолт: тянем данные из БД (название)
  const supabase = await createSupabaseServerClient();
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  const name = category?.name || 'Категория';

  return {
    title: `${name} — купить с доставкой в Краснодаре | KEY TO HEART`,
    description: `Свежие ${name.toLowerCase()} с доставкой по Краснодару за 60 минут. Фото перед отправкой, бесплатная открытка, оплата онлайн.`,
    alternates: { canonical: `https://keytoheart.ru/category/${slug}` },
    openGraph: {
      title: `${name} | KEY TO HEART`,
      description: `Закажите ${name.toLowerCase()} с доставкой. Фото перед отправкой, быстрая доставка.`,
      url: `https://keytoheart.ru/category/${slug}`,
      images: [
        {
          url: `https://keytoheart.ru/og-${slug}.webp`,
          width: 1200,
          height: 630,
          alt: `${name} — KEY TO HEART`,
        },
      ],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export const revalidate = 300;

/* ========================================================================= */
/*                              Главная функция                              */
/* ========================================================================= */
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; subcategory?: string }>;
}) {
  const { category: slug } = await params;
  const {
    sort: sortParam = 'newest',
    subcategory: initialSubcategory = 'all',
  } = await searchParams;

  const supabase = await createSupabaseServerClient();

  // Получаем категорию только по slug
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, slug, is_visible')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (categoryError || !categoryData) redirect('/404');

  const categoryId = categoryData.id;
  const apiName = categoryData.name;

  // Подкатегории
  const { data: subcategoriesData } = await supabase
    .from('subcategories')
    .select('id, name, slug, is_visible, category_id, label')
    .eq('category_id', categoryId)
    .eq('is_visible', true)
    .order('name', { ascending: true });

  const subcategories =
    subcategoriesData?.map((sub: Tables<'subcategories'>) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      is_visible: sub.is_visible ?? true,
      category_id: sub.category_id,
      label: sub.label,
    })) ?? [];

  // Проверяем ?subcategory
  if (subcategories.length > 0) {
    const subcategoryFromUrl = subcategories.find(
      (sub) => sub.slug === initialSubcategory,
    );
    if (initialSubcategory !== 'all' && !subcategoryFromUrl) {
      redirect(`/category/${slug}?sort=${sortParam}`);
    }
  }

  // Привязываем товары
  const { data: productCategoryData } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', categoryId);

  const productIds =
    productCategoryData?.map((item) => item.product_id) ?? [];

  // Если товаров нет
  if (productIds.length === 0) {
    return (
      <main aria-label={`Категория ${apiName}`}>
        <JsonLd<ItemList> item={{ '@type': 'ItemList', itemListElement: [] }} />
        <JsonLd<BreadcrumbList>
          item={{
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://keytoheart.ru' },
              { '@type': 'ListItem', position: 2, name: apiName, item: `https://keytoheart.ru/category/${slug}` },
            ],
          }}
        />
        <Suspense fallback={<div>Загрузка…</div>}>
          <CategoryPageClient
            products={[]}
            apiName={apiName}
            slug={slug}
            subcategories={subcategories}
          />
        </Suspense>
      </main>
    );
  }

  // Загружаем продукты
  const { data: productsData } = await supabase
    .from('products')
    .select(
      `id,title,price,discount_percent,original_price,in_stock,images,image_url,
       created_at,slug,bonus,short_desc,description,composition,is_popular,
       is_visible,order_index,production_time`,
    )
    .in('id', productIds)
    .eq('in_stock', true)
    .eq('is_visible', true)
    .order('id', { ascending: false });

  // Map product → subcategory[]
  const { data: productSubcategoryData } = await supabase
    .from('product_subcategories')
    .select('product_id, subcategory_id')
    .in('product_id', productIds);

  const productSubcategoriesMap = new Map<number, number[]>();
  productSubcategoryData?.forEach(({ product_id, subcategory_id }) => {
    const existing = productSubcategoriesMap.get(product_id) || [];
    productSubcategoriesMap.set(product_id, [...existing, subcategory_id]);
  });

  // Map subcategory_id → name
  const allSubIds = Array.from(
    new Set(productSubcategoryData?.map((i) => i.subcategory_id) ?? []),
  );
  const { data: subNames } = await supabase
    .from('subcategories')
    .select('id, name')
    .in('id', allSubIds);

  const subNameMap = new Map<number, string>();
  subNames?.forEach(({ id, name }) => subNameMap.set(id, name));

  // Приводим продукты к интерфейсу
  const products =
    productsData?.map((product: Tables<'products'>) => {
      const subIds = productSubcategoriesMap.get(product.id) || [];
      const subNamesArr = subIds
        .map((id) => subNameMap.get(id) || '')
        .filter(Boolean);

      return {
        id: product.id,
        title: product.title,
        price: product.price,
        discount_percent: product.discount_percent ?? null,
        original_price:
          typeof product.original_price === 'string'
            ? parseFloat(product.original_price)
            : null,
        in_stock: product.in_stock ?? true,
        images: product.images ?? [],
        image_url: product.image_url ?? null,
        created_at: product.created_at ?? null,
        slug: product.slug ?? null,
        bonus: product.bonus ?? null,
        short_desc: product.short_desc ?? null,
        description: product.description ?? null,
        composition: product.composition ?? null,
        is_popular: product.is_popular ?? false,
        is_visible: product.is_visible ?? true,
        category_ids: [categoryId],
        subcategory_ids: subIds,
        subcategory_names: subNamesArr,
        order_index: product.order_index ?? null,
        production_time: product.production_time ?? null,
      };
    }) ?? [];

  // JSON‑LD graph
  const ldGraph: Array<CollectionPage | BreadcrumbList | ItemList> = [
    {
      '@type': 'CollectionPage',
      name: apiName,
      url: `https://keytoheart.ru/category/${slug}`,
      description: `${apiName} с доставкой по Краснодару.`,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://keytoheart.ru' },
        { '@type': 'ListItem', position: 2, name: apiName, item: `https://keytoheart.ru/category/${slug}` },
      ],
    },
    {
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.title,
          url:  `https://keytoheart.ru/product/${p.id}`,
          image: p.images?.[0] ?? '',
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'RUB',
          },
        },
      })),
    },
  ];

  // Render
  return (
    <main aria-label={`Категория ${apiName}`}>
      <JsonLd<{ '@graph': unknown[] }> item={{ '@graph': ldGraph }} />

      <Suspense fallback={<div>Загрузка…</div>}>
        <CategoryPageClient
          products={products}
          apiName={apiName}
          slug={slug}
          subcategories={subcategories}
        />
      </Suspense>
    </main>
  );
}

/* ------------------ SSG: какие пути пререндерить ------------------ */
export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from('categories')
    .select('slug')
    .eq('is_visible', true);

  return (data ?? []).map((c: { slug: string }) => ({ category: c.slug }));
}
