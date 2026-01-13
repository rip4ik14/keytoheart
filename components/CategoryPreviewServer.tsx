// ✅ Путь: components/CategoryPreviewServer.tsx
import Link from 'next/link';
import ProductCard from './ProductCard';
import type { Product } from '@/types/product';

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
    .map((product) => ({ ...product, images: product.images || [] }))
    .slice(0, 8);

  if (!visibleProducts.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-2 sm:px-4 py-10 sm:py-12" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 uppercase tracking-tight"
      >
        {categoryName}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="text-center mt-7 sm:mt-8">
        <Link
          href={`/category/${seeMoreLink}`}
          className="inline-flex items-center justify-center rounded-full border border-black/15 px-6 py-3 text-[12px] sm:text-[13px] font-bold uppercase tracking-tight hover:bg-black hover:text-white transition"
        >
          показать еще
        </Link>
      </div>
    </section>
  );
}
