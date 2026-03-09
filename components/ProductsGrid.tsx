// components/ProductsGrid.tsx
'use client';

import ProductCard from '@components/ProductCard';
import { Product } from '@/types/product';

export default function ProductsGrid({
  products,
  apiName,
}: {
  products: Product[];
  apiName: string;
}) {
  const available = products
    .filter((p) => p.in_stock !== false)
    .map((p) => ({
      ...p,
      images: Array.isArray(p.images) ? p.images : [],
    }));

  return (
    <section
      className="mx-auto max-w-7xl px-2 sm:px-4 py-8 sm:py-16"
      aria-labelledby="products-grid-title"
    >
      <h1
        id="products-grid-title"
        className="mb-8 sm:mb-10 text-center text-2xl sm:text-3xl font-bold md:text-4xl"
      >
        {apiName}
      </h1>
      {available.length === 0 ? (
        <p className="text-center text-gray-500">Товары скоро появятся 🙌</p>
      ) : (
        <div
          className="
            grid
            grid-cols-2
            gap-x-2 gap-y-3
            sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
            sm:gap-x-4 sm:gap-y-6
            w-full
          "
          role="list"
        >
          {available.map((p) => (
            <div
              key={p.id}
              role="listitem"
              className="
                flex justify-center
              "
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
