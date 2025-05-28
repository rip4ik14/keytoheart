'use client';

import Link from 'next/link';
import ProductCard from '@components/ProductCard';
import { Product } from '@/types/product';

interface Props {
  categoryName: string;
  products: Product[];
  seeMoreLink: string;
  isVisible: boolean; // Добавляем параметр isVisible
}

export default function CategoryPreview({
  categoryName,
  products,
  seeMoreLink,
  isVisible,
}: Props) {
  // Если категория не видима, не отображаем её
  if (!isVisible) {
    return null;
  }

  const visibleProducts = products
    .filter((product) => product.in_stock !== false)
    .map((product) => ({
      ...product,
      images: product.images || [],
    }));

  return (
    <section
      className="max-w-7xl mx-auto px-4 py-12"
      aria-labelledby="category-preview-title"
    >
      <h2
        id="category-preview-title"
        className="text-2xl md:text-3xl font-bold text-center mb-8"
      >
        {categoryName}
      </h2>
      <div className="grid grid-cols-2 min-[480px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="text-center mt-6">
        <Link
          href={`/category/${seeMoreLink}`}
          className="text-black hover:underline font-medium"
          onClick={() => {
            window.gtag?.('event', 'see_more_category', {
              event_category: 'navigation',
              category: categoryName,
            });
            window.ym?.(96644553, 'reachGoal', 'see_more_category', {
              category: categoryName,
            });
          }}
          aria-label={`Посмотреть больше товаров в категории ${categoryName}`}
        >
          Показать ещё
        </Link>
      </div>
    </section>
  );
}