'use client';

import { useRef } from 'react';
import ProductCard from '@components/ProductCard';
import { Product } from '@/types/product';

type ProductWithPriority = Product & { priority?: boolean };

export default function PopularProductsClient({
  products,
}: {
  products: ProductWithPriority[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollCard = () => 280 + 24;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollCard(), behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollCard(), behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-center text-gray-500">
          Популярных товаров пока нет. Скоро они появятся!
        </p>
      </section>
    );
  }

  return (
    <section
      className="relative mx-auto max-w-7xl px-4 py-12"
      aria-labelledby="popular-products-title"
    >
      <h2
        id="popular-products-title"
        className="text-center text-2xl md:text-3xl font-sans font-bold mb-8 text-black"
      >
        ПОПУЛЯРНОЕ
      </h2>

      {/* ---- Mobile: Grid ---- */}
      <div className="sm:hidden grid grid-cols-2 gap-4">
        {products.map((p, idx) => (
          <ProductCard key={p.id} product={p} priority={idx === 0} />
        ))}
      </div>

      {/* ---- Desktop: Горизонтальный скролл — ровно 4 карточки ---- */}
      <div className="hidden sm:block relative">
        {/* Стрелка влево */}
        <button
          className="absolute left-[-28px] top-1/2 z-10 -translate-y-1/2 bg-white border border-gray-200 shadow w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition focus:outline-none"
          onClick={scrollLeft}
          aria-label="Назад"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Скролл-контейнер, видны ровно 4 карточки */}
        <div
          ref={scrollRef}
          className="
            flex gap-8
            overflow-x-auto no-scrollbar
            py-1 px-1
            snap-x snap-mandatory
            justify-start
            mx-auto
            w-[1216px]
          "
          style={{
            scrollBehavior: 'smooth',
            maxWidth: '1216px',
          }}
        >
          {products.map((p, idx) => (
            <div
              key={p.id}
              className="
                flex-shrink-0
                w-full
                max-w-[280px]
                snap-start
              "
              style={{ width: 280 }}
            >
              <ProductCard product={p} priority={idx === 0} />
            </div>
          ))}
        </div>

        {/* Стрелка вправо */}
        <button
          className="absolute right-[-28px] top-1/2 z-10 -translate-y-1/2 bg-white border border-gray-200 shadow w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition focus:outline-none"
          onClick={scrollRight}
          aria-label="Вперёд"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </section>
  );
}
