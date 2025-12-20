/* -------------------------------------------------------------------------- */
/*  Категория (SSR + Supabase + JSON-LD + SEO из БД)                           */
/*  Next.js 15+ App Router                                                     */
/* -------------------------------------------------------------------------- */

import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList, BreadcrumbList, CollectionPage } from 'schema-dts';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

import CategoryPageClient from './CategoryPageClient';

import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types_new';

const SITE_URL = 'https://keytoheart.ru';
export const revalidate = 300;

/* ------------------------ SEO-метаданные страницы ------------------------ */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: cat } = await supabase
    .from('categories')
    .select(
      'name, slug, is_visible, seo_h1, seo_title, seo_description, seo_text, og_image, seo_noindex',
    )
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  // если категории нет или скрыта
  if (!cat) {
    return {
      title: 'Категория не найдена | KEY TO HEART',
      robots: { index: false, follow: false },
    };
  }

  const name = cat.name || 'Категория';
  const canonical = `${SITE_URL}/category/${slug}`;

  const normalized = String(name).toLowerCase();
  const city = 'Краснодар';

  const titleFallback = `${name} - доставка в ${city} | KEY TO HEART`;
  const descFallback =
    `Закажите ${normalized} с доставкой по ${city} от 60 минут. ` +
    `Свежие ингредиенты, аккуратная сборка, фото перед отправкой, оплата онлайн.`;

  const title = (cat.seo_title || '').trim() || titleFallback;
  const description = (cat.seo_description || '').trim() || descFallback;

  // og_image можно хранить полным URL или относительным
  const ogImageRaw = (cat.og_image || '').trim();
  const ogImage =
    ogImageRaw && ogImageRaw.startsWith('http')
      ? ogImageRaw
      : ogImageRaw
        ? `${SITE_URL}${ogImageRaw.startsWith('/') ? '' : '/'}${ogImageRaw}`
        : `${SITE_URL}/og-${slug}.webp`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: cat.seo_noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${name} - KEY TO HEART` }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

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
  const { sort: sortParam = 'newest', subcategory: initialSubcategory = 'all' } =
    await searchParams;

  const supabase = await createSupabaseServerClient();

  // Категория
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, slug, is_visible, seo_h1, seo_text, seo_noindex')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (categoryError || !categoryData) notFound();

  const categoryId = categoryData.id;
  const apiName = categoryData.name;

  // Подкатегории
  const { data: subcategoriesData } = await supabase
    .from('subcategories')
    .select('id, name, slug, is_visible, category_id, label, seo_h1, seo_text, seo_noindex')
    .eq('category_id', categoryId)
    .eq('is_visible', true)
    .order('name', { ascending: true });

  const subcategories =
    subcategoriesData?.map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      is_visible: sub.is_visible ?? true,
      category_id: sub.category_id,
      label: sub.label ?? null,
      seo_h1: sub.seo_h1 ?? null,
      seo_text: sub.seo_text ?? null,
      seo_noindex: sub.seo_noindex ?? false,
    })) ?? [];

  // Если в URL мусорный subcategory - чистим
  if (subcategories.length > 0) {
    const ok = subcategories.find((s) => s.slug === initialSubcategory);
    if (initialSubcategory !== 'all' && !ok) {
      redirect(`/category/${slug}?sort=${sortParam}`);
    }
  }

  // Привязка товаров к категории
  const { data: productCategoryData } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', categoryId);

  const productIds = productCategoryData?.map((i) => i.product_id) ?? [];

  // Если нет товаров - страницу все равно отдаем (не теряем посадочную)
  if (productIds.length === 0) {
    const pageLdGraph: Array<CollectionPage | BreadcrumbList | ItemList> = [
      {
        '@type': 'CollectionPage',
        name: apiName,
        url: `${SITE_URL}/category/${slug}`,
        description: `${apiName} с доставкой по Краснодару.`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: apiName, item: `${SITE_URL}/category/${slug}` },
        ],
      },
      { '@type': 'ItemList', itemListElement: [] },
    ];

    return (
      <main aria-label={`Категория ${apiName}`}>
        <JsonLd<{ '@graph': unknown[] }> item={{ '@graph': pageLdGraph as any }} />
        <Suspense fallback={<div>Загрузка...</div>}>
          <CategoryPageClient
            products={[]}
            h1={(categoryData.seo_h1 || '').trim() || apiName}
            seoText={(categoryData.seo_text || '').trim() || null}
            slug={slug}
            subcategories={subcategories}
          />
        </Suspense>
      </main>
    );
  }

  // Товары
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

  // product -> subcategory ids
  const { data: productSubcategoryData } = await supabase
    .from('product_subcategories')
    .select('product_id, subcategory_id')
    .in('product_id', productIds);

  const productSubcategoriesMap = new Map<number, number[]>();
  productSubcategoryData?.forEach(({ product_id, subcategory_id }) => {
    const existing = productSubcategoriesMap.get(product_id) || [];
    productSubcategoriesMap.set(product_id, [...existing, subcategory_id]);
  });

  // subcategory_id -> name
  const allSubIds = Array.from(
    new Set(productSubcategoryData?.map((i) => i.subcategory_id) ?? []),
  );

  const { data: subNames } = await supabase
    .from('subcategories')
    .select('id, name')
    .in('id', allSubIds.length ? allSubIds : [-1]);

  const subNameMap = new Map<number, string>();
  subNames?.forEach(({ id, name }) => subNameMap.set(id, name));

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

  // JSON-LD graph (не раздуваем разметку)
  const pageLdGraph: Array<CollectionPage | BreadcrumbList | ItemList> = [
    {
      '@type': 'CollectionPage',
      name: apiName,
      url: `${SITE_URL}/category/${slug}`,
      description: `${apiName} с доставкой по Краснодару.`,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: apiName, item: `${SITE_URL}/category/${slug}` },
      ],
    },
    {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 24).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.title,
          url: `${SITE_URL}/product/${p.id}`,
          image: p.images?.[0] ?? '',
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
    },
  ];

  return (
    <main aria-label={`Категория ${apiName}`}>
      <JsonLd<{ '@graph': unknown[] }> item={{ '@graph': pageLdGraph as any }} />
      <Suspense fallback={<div>Загрузка...</div>}>
        <CategoryPageClient
          products={products}
          h1={(categoryData.seo_h1 || '').trim() || apiName}
          seoText={(categoryData.seo_text || '').trim() || null}
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
