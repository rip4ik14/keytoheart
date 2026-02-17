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
      {/* ✅ MOBILE header: слева название, справа стрелка */}
      <div className="sm:hidden flex items-center justify-between gap-3 mb-4 px-2">
        <h2 id={headingId} className="text-[22px] font-bold uppercase tracking-tight">
          {categoryName}
        </h2>

        <Link
          href={`/category/${seeMoreLink}`}
          className="shrink-0 w-11 h-11 rounded-full bg-black/[0.04] border border-black/10 shadow-[0_10px_22px_rgba(0,0,0,0.06)] inline-flex items-center justify-center active:scale-[0.98] transition"
          aria-label={`Перейти в категорию ${categoryName}`}
        >
          <span className="text-[20px] leading-none">→</span>
        </Link>
      </div>

      {/* ✅ DESKTOP header: как раньше по центру, без стрелки */}
      <h2
        id={headingId}
        className="hidden sm:block text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 uppercase tracking-tight"
      >
        {categoryName}
      </h2>

      {/* ✅ MOBILE: горизонтальный свайп без вылета за край */}
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

          {/* небольшой хвост, чтобы последняя карточка не липла к краю */}
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
