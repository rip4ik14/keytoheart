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

export default function CategoryPreviewServer({ categoryName, products, seeMoreLink, headingId }: Props) {
  const visibleProducts = products
    .filter((product) => product.in_stock !== false)
    .map((product) => ({ ...product, images: product.images || [] }))
    .slice(0, 8);

  if (!visibleProducts.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-2 sm:px-4 py-10 sm:py-12" aria-labelledby={headingId}>
      {/* ✅ MOBILE header: как в Самокате - слева заголовок, справа "Больше" + стрелка */}
      <div className="sm:hidden flex items-center justify-between gap-3 mb-3 px-2">
        <h2 id={headingId} className="text-[22px] font-extrabold tracking-tight">
          {categoryName}
        </h2>

        <Link
          href={`/category/${seeMoreLink}`}
          className="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-black/55 hover:text-black/70 transition"
          aria-label={`Перейти в категорию ${categoryName}`}
        >
          <span>Больше</span>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 6l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>

      {/* ✅ DESKTOP header: как раньше по центру, без стрелки */}
      <h2
        id={headingId}
        className="hidden sm:block text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 uppercase tracking-tight"
      >
        {categoryName}
      </h2>

      {/* ✅ MOBILE: горизонтальный свайп */}
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

      {/* ✅ DESKTOP: сетка как была */}
      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* ✅ DESKTOP: кнопка показать еще как была */}
      <div className="hidden sm:flex justify-center mt-7 sm:mt-8">
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
