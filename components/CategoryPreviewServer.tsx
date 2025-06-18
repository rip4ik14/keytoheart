import Link from 'next/link';
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
    .map((product) => ({ ...product, images: product.images || [] }));

  return (
    <section className="max-w-7xl mx-auto px-4 py-12" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-2xl md:text-3xl font-bold text-center mb-8 font-sans uppercase"
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
            />
          );
        })}
      </div>
      <div className="text-center mt-6">
        <Link
          href={`/category/${seeMoreLink}`}
          className="text-black hover:underline font-medium font-sans uppercase"
        >
          —ПОКАЗАТЬ ЕЩЕ—
        </Link>
      </div>
    </section>
  );
}
