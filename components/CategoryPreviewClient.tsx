// ✅ Путь: components/CategoryPreviewClient.tsx
'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';
import ProductCard from '@components/ProductCard';
import Link from 'next/link';
import { Product } from '@/types/product';

export default function CategoryPreviewClient({
  categoryName,
  products,
  seeMoreLink,
  headingId,
}: {
  categoryName: string;
  products: Product[];
  seeMoreLink: string;
  headingId: string;
}) {
  const visibleProducts = products
    .filter((product) => product.in_stock !== false)
    .map((product) => ({ ...product, images: product.images || [] }))
    .slice(0, 8);

  if (!visibleProducts.length) return null;

  const onSeeMore = () => {
    window.gtag?.('event', 'see_more_category', {
      event_category: 'navigation',
      category: categoryName,
    });
    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', 'see_more_category', { category: categoryName });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-2 sm:px-4 py-10 sm:py-12" aria-labelledby={headingId}>
      <div className="sm:hidden flex items-center justify-between gap-3 mb-4 px-2">
        <h2 id={headingId} className="text-[22px] font-bold uppercase tracking-tight">
          {categoryName}
        </h2>

        <Link
          href={`/category/${seeMoreLink}`}
          onClick={onSeeMore}
          className="shrink-0 w-11 h-11 rounded-full bg-black/[0.04] border border-black/10 shadow-[0_10px_22px_rgba(0,0,0,0.06)] inline-flex items-center justify-center active:scale-[0.98] transition"
          aria-label={`Перейти в категорию ${categoryName}`}
        >
          <span className="text-[20px] leading-none">→</span>
        </Link>
      </div>

      <h2
        id={headingId}
        className="hidden sm:block text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 uppercase tracking-tight"
      >
        {categoryName}
      </h2>

      <div className="sm:hidden">
        <div
          className={[
            'flex gap-3',
            'overflow-x-auto overscroll-x-contain',
            'pb-2 px-2',
            'snap-x snap-mandatory scroll-px-2',
            '[scrollbar-width:none]',
            '[-ms-overflow-style:none]',
            '[&::-webkit-scrollbar]:hidden',
          ].join(' ')}
        >
          {visibleProducts.map((product) => (
            <div key={product.id} className="shrink-0 w-[168px] snap-start">
              <ProductCard product={product} />
            </div>
          ))}
          <div className="shrink-0 w-2" />
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="hidden sm:flex justify-center mt-7 sm:mt-8">
        <Link
          href={`/category/${seeMoreLink}`}
          onClick={onSeeMore}
          className="inline-flex items-center justify-center rounded-full border border-black/15 px-6 py-3 text-[12px] sm:text-[13px] font-bold uppercase tracking-tight hover:bg-black hover:text-white transition"
        >
          показать еще
        </Link>
      </div>
    </section>
  );
}
