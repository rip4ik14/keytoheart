/* -------------------------------------------------------------------------- */
/*  Категория (SSR + Supabase + JSON-LD + SEO из БД)                         */
/*  Next.js 15+ App Router                                                    */
/* -------------------------------------------------------------------------- */

import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList, BreadcrumbList, CollectionPage } from 'schema-dts';
import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';

import CategoryPageClient from './CategoryPageClient';

import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types_new';

const SITE_URL = 'https://keytoheart.ru';

export const revalidate = 300;
export const dynamicParams = true;

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

  if (!cat) {
    return {
      title: 'Категория не найдена',
      robots: { index: false, follow: false },
    };
  }

  const name = cat.name || 'Категория';
  const canonical = `${SITE_URL}/category/${slug}`;
  const city = 'Краснодар';

  const titleFallback = `${name} - доставка в ${city}`;
  const descFallback =
    `Закажите ${name.toLowerCase()} с доставкой по ${city} от 30 минут. ` +
    `Свежие ингредиенты, аккуратная сборка, фото перед отправкой, оплата онлайн.`;

  const title = (cat.seo_title || '').trim() || titleFallback;
  const description = (cat.seo_description || '').trim() || descFallback;

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${name} - KeyToHeart` }],
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

  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, slug, is_visible, seo_h1, seo_text, seo_noindex')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (categoryError || !categoryData) notFound();

  const categoryId = categoryData.id;
  const apiName = categoryData.name;

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

  if (subcategories.length > 0) {
    const ok = subcategories.find((s) => s.slug === initialSubcategory);
    if (initialSubcategory !== 'all' && !ok) {
      redirect(`/category/${slug}?sort=${sortParam}`);
    }
  }

  const { data: productCategoryData } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', categoryId);

  const productIds = productCategoryData?.map((i) => i.product_id) ?? [];

  if (productIds.length === 0) {
    return (
      <main>
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

  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('in_stock', true)
    .eq('is_visible', true)
    .order('id', { ascending: false });

  const products =
    productsData?.map((product: Tables<'products'>) => ({
      ...product,
      category_ids: [categoryId],
      subcategory_ids: [],
      subcategory_names: [],
    })) ?? [];

  return (
    <main>
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
