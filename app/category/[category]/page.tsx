/* -------------------------------------------------------------------------- */
/*  Категория (SSR + Supabase + JSON-LD + SEO из БД)                         */
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

/* ----------------------------- SEO Metadata ------------------------------ */
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

  const name = cat.name;
  const canonical = `${SITE_URL}/category/${slug}`;

  const title =
    cat.seo_title?.trim() ||
    `${name} - доставка в Краснодаре`;

  const description =
    cat.seo_description?.trim() ||
    `Закажите ${name.toLowerCase()} с доставкой по Краснодару. Фото перед отправкой, аккуратная упаковка.`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: cat.seo_noindex ? { index: false, follow: false } : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*                                PAGE                                        */
/* -------------------------------------------------------------------------- */

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; subcategory?: string }>;
}) {
  const { category: slug } = await params;
  const { sort = 'newest', subcategory = 'all' } = await searchParams;

  const supabase = await createSupabaseServerClient();

  const { data: categoryData } = await supabase
    .from('categories')
    .select('id, name, slug, is_visible, seo_h1, seo_text')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (!categoryData) notFound();

  const categoryId = categoryData.id;

  /* ---------------------- Подкатегории ---------------------- */

  const { data: subcategoriesData } = await supabase
    .from('subcategories')
    .select('id, name, slug, is_visible, category_id')
    .eq('category_id', categoryId)
    .eq('is_visible', true)
    .order('name', { ascending: true });

  const subcategories =
    subcategoriesData?.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      is_visible: sub.is_visible ?? true,
      category_id: sub.category_id,
    })) ?? [];

  if (subcategory !== 'all' && !subcategories.find((s) => s.slug === subcategory)) {
    redirect(`/category/${slug}?sort=${sort}`);
  }

  /* ---------------------- Товары ---------------------- */

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
            h1={(categoryData.seo_h1 || '').trim() || categoryData.name}
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
    .eq('is_visible', true)
    .eq('in_stock', true)
    .order('id', { ascending: false });

  const products =
    productsData?.map((product: Tables<'products'>) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      discount_percent: product.discount_percent ?? null,
      original_price:
        typeof product.original_price === 'string'
          ? parseFloat(product.original_price)
          : product.original_price ?? null,
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
      order_index: product.order_index ?? null,
      production_time: product.production_time ?? null,
      category_ids: [categoryId],
      subcategory_ids: [],
      subcategory_names: [],
    })) ?? [];

  return (
    <main>
      <Suspense fallback={<div>Загрузка...</div>}>
        <CategoryPageClient
          products={products}
          h1={(categoryData.seo_h1 || '').trim() || categoryData.name}
          seoText={(categoryData.seo_text || '').trim() || null}
          slug={slug}
          subcategories={subcategories}
        />
      </Suspense>
    </main>
  );
}

/* ------------------ SSG fallback ------------------ */

export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from('categories')
    .select('slug')
    .eq('is_visible', true);

  return (data ?? []).map((c: { slug: string }) => ({ category: c.slug }));
}
