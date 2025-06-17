import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { JsonLd } from 'react-schemaorg';
import type { Product as SchemaProduct, AggregateOffer } from 'schema-dts';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import Breadcrumbs from '@components/Breadcrumbs';
import ProductPageClient from './ProductPageClient';
import { Product, ComboItem } from './types';


export const revalidate = 3600;

/* ------------------------------------------------------------------ */
/*                              TYPES                                 */
/* ------------------------------------------------------------------ */
export async function generateStaticParams() {
  const data = await prisma.products.findMany({
    where: { is_visible: true },
    select: { id: true },
  });
  return data.map(p => ({ id: String(p.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = Number(params.id);
  if (Number.isNaN(id)) return {};

  const data = await prisma.products.findUnique({
    where: { id },
    select: { title: true, description: true, images: true },
  });

  if (!data) {
    return {
      title: 'Товар не найден | KEY TO HEART',
      description: 'Страница товара не найдена.',
    };
  }

  const desc = (data.description ?? '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 160);

  const firstImg =
    Array.isArray(data.images) && data.images[0] ? data.images[0] : '/og-cover.webp';
  const url = `https://keytoheart.ru/product/${id}`;

  return {
    title: `${data.title} | KEY TO HEART`,
    description: desc || undefined,
    openGraph: { title: data.title, description: desc, url, images: [{ url: firstImg }] },
    twitter: { card: 'summary_large_image', title: data.title, description: desc, images: [firstImg] },
    alternates: { canonical: url },
  };
}

/* ------------------------------------------------------------------ */
export default async function ProductPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  /* ---- один запрос с джойном категорий ---- */
  const data = await prisma.products.findFirst({
    where: { id, is_visible: true },
    include: { product_categories: { select: { category_id: true } } },
  });

  if (!data || data.in_stock === false) notFound();

  const product: Product = {
    id: data.id,
    title: data.title ?? 'Без названия',
    price: data.price ?? 0,
    original_price:
      data.original_price !== null && typeof data.original_price === 'object' && 'toNumber' in data.original_price
        ? data.original_price.toNumber()
        : data.original_price !== null
          ? Number(data.original_price)
          : undefined,
    discount_percent: data.discount_percent ?? 0,
    images: Array.isArray(data.images) ? data.images : [],
    description: data.description ?? '',
    composition: data.composition ?? '',
    production_time: data.production_time ?? null,
    category_ids: data.product_categories?.map(c => c.category_id) ?? [],
  };

  /* ---- апселлы ---- */
  const upsells = await prisma.upsell_items.findMany({
    select: { id: true, title: true, price: true, image_url: true },
  });

  const combos: ComboItem[] = upsells.map(u => ({
    id: Number(u.id),
    title: u.title,
    price: u.price,
    image: u.image_url ?? '',
  }));

  const finalPrice =
    product.discount_percent && product.discount_percent > 0
      ? Math.round(product.price * (1 - product.discount_percent / 100))
      : product.price;

  const offer: AggregateOffer = {
    '@type': 'AggregateOffer',
    priceCurrency: 'RUB',
    lowPrice: finalPrice,
    highPrice: product.original_price ?? product.price,
    offerCount: 1,
    price: finalPrice,
    availability: 'https://schema.org/InStock',
  };

  return (
    <main aria-label={`Товар ${product.title}`}>
      <JsonLd<SchemaProduct>
        item={{
          '@type': 'Product',
          sku: String(product.id),
          name: product.title,
          url: `https://keytoheart.ru/product/${product.id}`,
          image: product.images.length ? product.images : undefined,
          description: product.description || undefined,
          material: product.composition || undefined,
          category: product.category_ids.join(',') || undefined,
          brand: { '@type': 'Brand', name: 'KEY TO HEART' },
          offers: offer,
        }}
      />

      <Suspense fallback={null}>
        <Breadcrumbs productTitle={product.title} />
      </Suspense>

      <Suspense fallback={<div className="text-center py-8">Загрузка…</div>}>
        <ProductPageClient product={product} combos={combos} />
      </Suspense>
    </main>
  );
}
