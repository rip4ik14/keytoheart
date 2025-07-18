/* -------------------------------------------------------------------------- */
/*  Категория (SSR + Supabase + JSON‑LD CollectionPage & Breadcrumb)          */
/*  Версия: 2025‑07‑18 — для кластеров «Цветы» и «Комбо‑наборы»               */
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

/* ----------------------------- Типы данных ----------------------------- */
interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent: number | null;
  original_price: number | null | undefined;
  in_stock: boolean;
  images: string[];
  image_url: string | null;
  created_at: string | null;
  slug: string | null;
  bonus: number | null;
  short_desc: string | null;
  description: string | null;
  composition: string | null;
  is_popular: boolean;
  is_visible: boolean;
  category_ids: number[];
  subcategory_ids: number[];
  subcategory_names: string[];
  order_index: number | null;
  production_time: number | null;
}

interface Subcategory {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
  category_id: number | null;
  label: string | null;
}

/* ------------------------ slug ⇄ отображаемое имя ----------------------- */
const nameMap: Record<string, string> = {
  'klubnichnye-bukety': 'Клубничные букеты',
  'klubnichnye-boksy':  'Клубничные боксы',
  flowers:              'Цветы',
  combo:                'Комбо‑наборы',
  premium:              'Premium',
  kollekcii:            'Коллекции',
  povod:                'Повод',
  podarki:              'Подарки',
  /* --- подкатегории ниже (оставлены без изменений) --- */
  'club-box': 'Club Box',
  roses: 'Roses',
  'mono-bouquets': 'Mono Bouquets',
  'wedding-bouquets': 'Wedding Bouquets',
  'author-bouquets': 'Author Bouquets',
  pasha: 'Pasha',
  vesna: 'Vesna',
  arabia: 'Arabia',
  kids: 'Kids',
  men: 'Men',
  mame: 'Mame',
  lubimoi: 'Lubimoi',
  muzhchine: 'Muzhchine',
  detyam: 'Detyam',
  uchitelyu: 'Uchitelyu',
  kollege: 'Kollege',
  wedding: 'Wedding',
  bday: 'Bday',
  vipusknoi: 'Vipusknoi',
  birth: 'Birth',
  care: 'Care',
  balloons: 'Balloons',
  'gifts-nabori': 'Gifts Nabory',
  cards: 'Cards',
};

/* ------------------------ SEO‑метаданные страницы ----------------------- */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const name = nameMap[category] ?? 'Категория';

  /* --- кастомные кластеры «Цветы» и «Комбо‑наборы» --- */
  if (category === 'flowers') {
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

  if (category === 'combo') {
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

  /* --- дефолт для остальных категорий --- */
  return {
    title: `${name} — купить с доставкой в Краснодаре | KEY TO HEART`,
    description: `Свежие ${name.toLowerCase()} с доставкой по Краснодару за 60 минут. Фото перед отправкой, бесплатная открытка, оплата онлайн.`,
    alternates: { canonical: `https://keytoheart.ru/category/${category}` },
    openGraph: {
      title: `${name} | KEY TO HEART`,
      description: `Закажите ${name.toLowerCase()} с доставкой. Фото перед отправкой, быстрая доставка.`,
      url: `https://keytoheart.ru/category/${category}`,
      images: [
        {
          url: `https://keytoheart.ru/og-${category}.webp`,
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
  /* ------------------ Supabase: init ------------------ */
  const supabase = await createSupabaseServerClient();
  const { category } = await params;
  const {
    sort: sortParam = 'newest',
    subcategory: initialSubcategory = 'all',
  } = await searchParams;

  /* ---------- Проверка slug ---------- */
  const apiName = nameMap[category];
  if (!apiName) redirect('/404');

  /* ---------- Получаем категорию ---------- */
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, slug, is_visible')
    .eq('name', apiName)
    .eq('is_visible', true)
    .single();

  if (categoryError || !categoryData) redirect('/404');
  if (categoryData.slug !== category) redirect(`/category/${categoryData.slug}`);

  const categoryId = categoryData.id;

  /* ---------- Подкатегории ---------- */
  const { data: subcategoriesData } = await supabase
    .from('subcategories')
    .select('id, name, slug, is_visible, category_id, label')
    .eq('category_id', categoryId)
    .eq('is_visible', true)
    .order('name', { ascending: true });

  const subcategories: Subcategory[] =
    subcategoriesData?.map((sub: Tables<'subcategories'>) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      is_visible: sub.is_visible ?? true,
      category_id: sub.category_id,
      label: sub.label,
    })) ?? [];

  /* ---------- Проверяем ?subcategory ---------- */
  if (subcategories.length > 0) {
    const subcategoryFromUrl = subcategories.find(
      (sub) => sub.slug === initialSubcategory,
    );
    if (initialSubcategory !== 'all' && !subcategoryFromUrl) {
      redirect(`/category/${category}?sort=${sortParam}`);
    }
  }

  /* ---------- Привязываем товары ---------- */
  const { data: productCategoryData } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', categoryId);

  const productIds =
    productCategoryData?.map((item) => item.product_id) ?? [];

  /* ---------- Если товаров нет ---------- */
  if (productIds.length === 0) {
    return (
      <main aria-label={`Категория ${apiName}`}>
        <JsonLd<ItemList> item={{ '@type': 'ItemList', itemListElement: [] }} />
        <JsonLd<BreadcrumbList>
          item={{
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://keytoheart.ru' },
              { '@type': 'ListItem', position: 2, name: apiName, item: `https://keytoheart.ru/category/${category}` },
            ],
          }}
        />
        <Suspense fallback={<div>Загрузка…</div>}>
          <CategoryPageClient
            products={[]}
            apiName={apiName}
            slug={category}
            subcategories={subcategories}
          />
        </Suspense>
      </main>
    );
  }

  /* ---------- Загружаем сами продукты ---------- */
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

  /* ---------- Map product → subcategory[] ---------- */
  const { data: productSubcategoryData } = await supabase
    .from('product_subcategories')
    .select('product_id, subcategory_id')
    .in('product_id', productIds);

  const productSubcategoriesMap = new Map<number, number[]>();
  productSubcategoryData?.forEach(({ product_id, subcategory_id }) => {
    const existing = productSubcategoriesMap.get(product_id) || [];
    productSubcategoriesMap.set(product_id, [...existing, subcategory_id]);
  });

  /* ---------- Map subcategory_id → name ---------- */
  const allSubIds = Array.from(
    new Set(productSubcategoryData?.map((i) => i.subcategory_id) ?? []),
  );
  const { data: subNames } = await supabase
    .from('subcategories')
    .select('id, name')
    .in('id', allSubIds);

  const subNameMap = new Map<number, string>();
  subNames?.forEach(({ id, name }) => subNameMap.set(id, name));

  /* ---------- Приводим продукты к интерфейсу ---------- */
  const products: Product[] =
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

  /* ------------------- JSON‑LD graph ------------------- */
  const ldGraph: Array<CollectionPage | BreadcrumbList | ItemList> = [
    {
      '@type': 'CollectionPage',
      name: apiName,
      url: `https://keytoheart.ru/category/${category}`,
      description: `${apiName} с доставкой по Краснодару.`,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://keytoheart.ru' },
        { '@type': 'ListItem', position: 2, name: apiName, item: `https://keytoheart.ru/category/${category}` },
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

  /* ------------------------- Render ------------------------- */
  return (
    <main aria-label={`Категория ${apiName}`}>
      <JsonLd<{ '@graph': unknown[] }> item={{ '@graph': ldGraph }} />

      <Suspense fallback={<div>Загрузка…</div>}>
        <CategoryPageClient
          products={products}
          apiName={apiName}
          slug={category}
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
