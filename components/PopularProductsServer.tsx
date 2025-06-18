// ✅ Путь: components/PopularProductsServer.tsx
import { JsonLd } from 'react-schemaorg';
import type { ItemList } from 'schema-dts';
import PopularProductsClient from '@components/PopularProductsClient';
import SkeletonCard from '@components/ProductCardSkeleton';
import { Product } from '@/types/product';

export const revalidate = 60;

export default async function PopularProductsServer() {
  try {
    const res = await fetch('/api/popular', { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const raw = await res.json();
    if (!Array.isArray(raw)) throw new Error('Expected array response');

    const products: Product[] = raw.map((item: any) => {
      const discountPercent = item.discount_percent ?? 0;
      const originalPrice = item.original_price || item.price;
      const computedPrice = discountPercent
        ? Math.round(item.price * (1 - discountPercent / 100))
        : item.price;
      const discountAmount = discountPercent
        ? (originalPrice > item.price ? originalPrice : item.price) -
          computedPrice
        : 0;

      return {
        id: item.id,
        title: item.title,
        price: item.price,
        discount_percent: discountPercent,
        in_stock: item.in_stock ?? false,
        images: (item.images ?? []) as string[],
        category_ids: item.category_ids ?? [],
        production_time: item.production_time ?? null,
        is_popular: item.is_popular ?? null,
        computedPrice,
        discountAmount,
      };
    });

    return (
      <>
        <JsonLd<ItemList>
          item={{
            '@type': 'ItemList',
            itemListElement: products
              .filter(
                (p): p is Product & { images: string[] } =>
                  Array.isArray(p.images) && p.images.length > 0,
              )
              .map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                  '@type': 'Product',
                  name: p.title,
                  url: `https://keytoheart.ru/product/${p.id}`,
                  image: p.images[0],
                  offers: {
                    '@type': 'Offer',
                    price: p.computedPrice ?? p.price,
                    priceCurrency: 'RUB',
                    availability: p.in_stock
                      ? 'https://schema.org/InStock'
                      : 'https://schema.org/OutOfStock',
                  },
                },
              })),
          }}
        />
        <PopularProductsClient products={products} />
      </>
    );
  } catch (err) {
    process.env.NODE_ENV !== 'production' &&
      console.error('PopularProductsServer error:', err);
    return (
      <section
        aria-labelledby="popular-products-heading"
        className="max-w-7xl mx-auto px-4 py-12"
      >
        <h2 id="popular-products-heading" className="sr-only">
          Популярные товары
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }
}
