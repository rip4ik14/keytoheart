'use client';

import ProductCard from '@components/ProductCard';
import { Product } from '@/types/product'; // Импортируем тип Product

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
      images: p.images || [], // Гарантируем, что images всегда массив
    }));

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-16"
      aria-labelledby="products-grid-title"
    >
      <h1
        id="products-grid-title"
        className="mb-10 text-center text-3xl font-bold md:text-4xl"
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
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
            xl:grid-cols-6
            gap-6
          "
          role="list"
        >
          {available.map((p) => (
            <div key={p.id} role="listitem">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}