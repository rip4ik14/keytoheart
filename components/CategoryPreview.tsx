'use client';

import Link from 'next/link';
import ProductCard from '@components/ProductCard';
import ProductCardSkeleton from '@components/ProductCardSkeleton';
import { Product } from '@/types/product';
import { useState, useEffect } from 'react';

interface Props {
  categoryName: string;
  products: Product[];
  seeMoreLink: string;
  headingId: string;
  isVisible?: boolean; // если не нужен — можно удалить
}

export default function CategoryPreview({
  categoryName,
  products,
  seeMoreLink,
  headingId,
  isVisible = true,
}: Props) {
  // Если нужен "режим загрузки" для SSR — оставь useState/useEffect
  const [loading, setLoading] = useState(products.length === 0);
  useEffect(() => {
    if (products.length > 0) setLoading(false);
  }, [products.length]);

  if (!isVisible) return null;

  // Обрезаем максимум 6 товаров (или сколько нужно)
  const visibleProducts = products
    .filter((p) => p.in_stock !== false)
    .map((p) => ({ ...p, images: p.images || [] }))
    .slice(0, 8);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-2xl md:text-3xl font-bold text-center mb-8 font-sans uppercase"
      >
        {categoryName}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>
      <div className="text-center mt-6">
        <Link
          href={`/category/${seeMoreLink}`}
          className="text-black hover:underline font-medium font-sans uppercase"
          aria-label={`Посмотреть больше товаров в категории ${categoryName}`}
        >
          —ПОКАЗАТЬ ЕЩЕ—
        </Link>
      </div>
    </section>
  );
}
