/* -------------------------------------------------------------------------- */
/*  Страница товара (SSR + Supabase, JSON-LD Product / Breadcrumb)            */
/*  Версия: 2026-01-05 - оптимизация select, cookies setAll, стабильный SSR    */
/* -------------------------------------------------------------------------- */

import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { JsonLd } from 'react-schemaorg';
import type { Product as SchemaProduct, Offer } from 'schema-dts';
import type { Database } from '@/lib/supabase/types_new';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import Breadcrumbs from '@components/Breadcrumbs';
import ProductPageClient from './ProductPageClient';
import { Product, ComboItem } from './types';

/* ---------- Supabase анонимный клиент ---------- */
const supabaseAnon = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const revalidate = 3600;

/* ------------------------ SSG paths ----------------------- */
export async function generateStaticParams() {
  const { data } = await supabaseAnon.from('products').select('id').eq('is_visible', true);
  return data?.map((p) => ({ id: String(p.id) })) ?? [];
}

/* ----------------------- Metadata ------------------------ */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const productId = Number(id);
  if (Number.isNaN(productId)) return {};

  const { data } = await supabaseAnon
    .from('products')
    .select('title, description, images')
    .eq('id', productId)
    .single();

  if (!data) {
    return {
      title: 'Товар не найден',
      description: 'Страница товара не найдена.',
      robots: { index: false, follow: false },
    };
  }

  const cleanDesc = (data.description ?? '').replace(/<[^>]*>/g, '').trim();
  const desc =
    cleanDesc ||
    'Клубника в шоколаде и цветочные букеты с доставкой 30 мин по Краснодару. Фото перед отправкой, бесплатная открытка, удобная оплата онлайн.';

  const firstImg =
    Array.isArray(data.images) && data.images[0]
      ? data.images[0]
      : 'https://keytoheart.ru/og-cover.webp';

  const url = `https://keytoheart.ru/product/${productId}`;

  return {
    title: data.title,
    description: desc.slice(0, 160),
    openGraph: {
      title: data.title,
      description: desc,
      url,
      images: [{ url: firstImg, width: 1200, height: 630, alt: data.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: desc,
      images: [firstImg],
    },
    alternates: { canonical: url },
  };
}

/* ------------------------------------------------------------------ */
/*                               Page                                 */
/* ------------------------------------------------------------------ */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (Number.isNaN(productId)) notFound();

  /* ---------- Supabase SSR-client ---------- */
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
        setAll: (cookiesToSet) => {
          // важно: в некоторых окружениях cookies() может быть readonly
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // @ts-ignore
              cookieStore.set?.(name, value, options);
            });
          } catch {}
        },
      },
    },
  );

  /* ---------- Товар + категории (без select '*') ---------- */
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id,
        title,
        price,
        original_price,
        discount_percent,
        images,
        description,
        composition,
        production_time,
        in_stock,
        is_visible,
        product_categories(category_id)
      `,
    )
    .eq('id', productId)
    .eq('is_visible', true)
    .single();

  if (error || !data || data.in_stock === false) notFound();

  const categoryIds: number[] = (data.product_categories as any[] | null)?.map((c) => c.category_id) ?? [];
  const firstCatId = categoryIds[0];

  /* ---------- Получаем первую категорию ---------- */
  let categorySlug = '';
  let categoryName = '';

  if (firstCatId) {
    const { data: cat } = await supabase
      .from('categories')
      .select('name, slug')
      .eq('id', firstCatId)
      .single();

    if (cat) {
      categorySlug = cat.slug;
      categoryName = cat.name;
    }
  }

  const product: Product = {
    id: data.id,
    title: data.title ?? 'Без названия',
    price: data.price ?? 0,
    original_price: data.original_price ?? undefined,
    discount_percent: data.discount_percent ?? 0,
    images: (data.images as any) ?? [],
    description: data.description ?? '',
    composition: data.composition ?? '',
    production_time: data.production_time ?? null,
    category_ids: categoryIds,
  };

  /* ---------- Upsell ---------- */
  let combos: ComboItem[] = [];
  try {
    const { data: upsells } = await supabase
      .from('upsell_items')
      .select('id, title, price, image_url')
      .limit(60);

    combos =
      upsells?.map((u: any) => ({
        id: Number(u.id),
        title: u.title,
        price: u.price,
        image: u.image_url ?? '',
      })) ?? [];
  } catch (e) {
    process.env.NODE_ENV !== 'production' && console.error('upsell_items ->', e);
  }

  /* ---------- Финальная цена ---------- */
  const finalPrice =
    product.discount_percent && product.discount_percent > 0
      ? Math.round(product.price * (1 - product.discount_percent / 100))
      : product.price;

  const productUrl = `https://keytoheart.ru/product/${product.id}`;

  const offer: Offer = {
    '@type': 'Offer',
    url: productUrl,
    priceCurrency: 'RUB',
    price: finalPrice,
    priceValidUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: 'KEY TO HEART',
      url: 'https://keytoheart.ru',
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: 'RUB',
      },
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: 'RU',
        addressRegion: 'Краснодарский край',
      },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: {
          '@type': 'QuantitativeValue',
          minValue: 0,
          maxValue: 30,
          unitCode: 'MIN',
        },
      },
    },
  };

  return (
    <main aria-label={`Товар ${product.title}`}>
      <JsonLd<SchemaProduct>
        item={{
          '@type': 'Product',
          sku: String(product.id),
          name: product.title,
          url: productUrl,
          image: Array.isArray(product.images) && product.images.length > 0 ? product.images : undefined,
          description: product.description || undefined,
          additionalProperty: product.production_time
            ? [
                {
                  '@type': 'PropertyValue',
                  name: 'Время производства',
                  value: `${product.production_time} мин`,
                },
              ]
            : undefined,
          material: product.composition || undefined,
          category: categoryName || undefined,
          brand: { '@type': 'Brand', name: 'KEY TO HEART' },
          offers: offer,
        }}
      />

      <JsonLd
        item={{
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://keytoheart.ru' },
            ...(categorySlug
              ? [
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: categoryName,
                    item: `https://keytoheart.ru/category/${categorySlug}`,
                  },
                ]
              : []),
            {
              '@type': 'ListItem',
              position: categorySlug ? 3 : 2,
              name: product.title,
              item: productUrl,
            },
          ] as any,
        }}
      />

      <Suspense fallback={null}>
        <Breadcrumbs
          productTitle={product.title}
          categorySlug={categorySlug || undefined}
          categoryName={categoryName || undefined}
        />
      </Suspense>

      <Suspense fallback={<div className="text-center py-8">Загрузка…</div>}>
        <ProductPageClient product={product} combos={combos} />
      </Suspense>
    </main>
  );
}
