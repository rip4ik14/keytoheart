import Link from 'next/link';
import { JsonLd } from 'react-schemaorg';
import type { ItemList } from 'schema-dts';
import ProductCard from './ProductCard';
import type { Product } from '@/types/product';
import { claimPriority } from '@/utils/imagePriority';

interface Props {
  categoryName: string;
  products: Product[];
  seeMoreLink: string;
  headingId: string;
}

export default function CategoryPreviewServer({
  categoryName,
  products,
  seeMoreLink,
  headingId,
}: Props) {
  const visibleProducts = products
    .filter((product) => product.in_stock !== false)
    .map((product) => {
      const discountPercent = product.discount_percent ?? 0;
      const originalPrice = product.original_price || product.price;
      const computedPrice = discountPercent
        ? Math.round(product.price * (1 - discountPercent / 100))
        : product.price;
      const discountAmount = discountPercent
        ? (originalPrice > product.price ? originalPrice : product.price) - computedPrice
        : 0;
      return {
        ...product,
        images: product.images || [],
        computedPrice,
        discountAmount,
      };
    })
    .slice(0, 4);

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12" aria-labelledby={headingId}>
      <JsonLd<ItemList>
        item={{
          '@type': 'ItemList',
          itemListElement: visibleProducts
            .filter((p) => p.images && p.images.length > 0)
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
                  price: p.computedPrice,
                  priceCurrency: 'RUB',
                  availability: p.in_stock
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                },
              },
            })),
        }}
      />
      <h2
        id={headingId}
        className="text-center mb-8 font-bold uppercase"
        style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontFamily: 'var(--font-golos)' }}
      >
        {categoryName}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {visibleProducts.map((product, idx) => {
          const shouldPrioritize = idx === 0 && claimPriority();
          return (
            <ProductCard
              key={product.id}
              product={product}
              priority={shouldPrioritize}
              loading={idx > 0 ? 'lazy' : undefined}
            />
          );
        })}
      </div>
      <div className="text-center mt-6">
        <Link
          href={`/category/${seeMoreLink}`}
          className="text-black hover:underline font-medium uppercase"
          style={{ fontFamily: 'var(--font-golos)', fontSize: 'clamp(14px, 3vw, 16px)' }}
          aria-label={`Показать больше товаров в категории ${categoryName}`}
        >
          —ПОКАЗАТЬ ЕЩЕ—
        </Link>
      </div>
    </section>
  );
}