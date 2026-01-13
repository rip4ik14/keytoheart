// ✅ Путь: components/PopularProductsClient.tsx
'use client';

import { useRef } from 'react';
import ProductCard from '@components/ProductCard';
import type { Product } from '@/types/product';

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

      {/* ✅ Mobile: Grid */}
      <div className="sm:hidden grid grid-cols-2 gap-4">
        {products.map((p, idx) => (
          <ProductCard key={p.id} product={p} priority={idx === 0} shadowMode="none" />
        ))}
      </div>

      {/* ✅ Desktop: Carousel */}
      <div className="hidden sm:block relative">
        {/* Стрелка влево */}
        <button
          className="absolute left-[-28px] top-1/2 z-10 -translate-y-1/2 bg-white border border-gray-200 shadow w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition focus:outline-none"
          onClick={scrollLeft}
          aria-label="Назад"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="#222"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* ✅ ВАЖНО:
            1) overflow visible - чтобы ничего не обрезалось (тени/hover)
            2) padding сверху/снизу - чтобы при hover не "толкало" соседей визуально
            3) pointer-events/scroll - без побочных эффектов */}
        <div
          ref={scrollRef}
          className={[
            'flex gap-8',
            'overflow-x-auto no-scrollbar',
            'py-6 px-1', // чуть больше вертикального пространства под hover-эффект
            'snap-x snap-mandatory',
            'justify-start',
            'mx-auto',
            'w-[1216px]',
            'overflow-y-visible', // ✅ чтобы hover не резался по вертикали
            'overflow-visible', // ✅ важнее всего - тени/скейл не режем
          ].join(' ')}
          style={{
            scrollBehavior: 'smooth',
            maxWidth: '1216px',
          }}
        >
          {products.map((p, idx) => (
            <div
              key={p.id}
              className={[
                'flex-shrink-0',
                'w-full',
                'max-w-[280px]',
                'snap-start',
                'overflow-visible', // ✅ не режем тень карточки внутри враппера
              ].join(' ')}
              style={{ width: 280 }}
            >
              {/* ✅ Убираем тень у популярных + фикс "скачет" уже внутри ProductCard:
                  - кнопка там не меняет высоту, она overlay внутри фиксированного места
                  - hover-эффект через transform, без изменения layout */}
              <ProductCard product={p} priority={idx === 0} shadowMode="none" />
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
            <path
              d="M9 6L15 12L9 18"
              stroke="#222"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
