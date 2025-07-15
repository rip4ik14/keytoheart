'use client';

import { useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import ProductCard from '@components/ProductCard';
import { Product } from '@/types/product';
import Image from 'next/image';

type ProductWithPriority = Product & { priority?: boolean };

export default function PopularProductsClient({
  products,
}: {
  products: ProductWithPriority[];
}) {
  if (!products || products.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-center text-gray-500">
          Популярных товаров пока нет. Скоро они появятся!
        </p>
      </section>
    );
  }

  const prepared = useMemo(
    () =>
      products.map((p) => ({
        ...p,
        images: p.images || [],
        category_ids: p.category_ids || [],
      })),
    [products],
  );

  /* loop только если товаров больше, чем видимо на десктопе */
  const loopDesktop = prepared.length > 4;

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

      {/* мобильная сетка 2×N  (Suppress, чтобы не сравнивать стили при гидрации) */}
      <div
        key="grid"
        suppressHydrationWarning
        className="sm:hidden grid grid-cols-2 gap-4"
      >
        {prepared.map((p) => (
          <ProductCard key={p.id} product={p} priority={!!p.priority} />
        ))}
      </div>

      {/* tablet/desktop — Swiper */}
      <div key="swiper" className="relative hidden sm:block">
        <Swiper
          modules={[Navigation]}
          loop={loopDesktop}
          navigation={{ nextEl: '.popular-next', prevEl: '.popular-prev' }}
          slidesPerView={2.2}
          spaceBetween={16}
          breakpoints={{ 1024: { slidesPerView: 4, spaceBetween: 24 } }}
          className="group"
        >
          {prepared.map((p) => (
            <SwiperSlide key={p.id} className="flex justify-center">
              <ProductCard product={p} priority={!!p.priority} />
            </SwiperSlide>
          ))}

          <button
            className="popular-prev absolute left-0 top-1/2 z-[2] -translate-y-1/2
                       rounded-full bg-white p-2 shadow hover:bg-gray-100
                       focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Назад"
          >
            <Image src="/icons/chevron-left.svg" alt="" width={20} height={20} />
          </button>
          <button
            className="popular-next absolute right-0 top-1/2 z-[2] -translate-y-1/2
                       rounded-full bg-white p-2 shadow hover:bg-gray-100
                       focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Вперёд"
          >
            <Image src="/icons/chevron-right.svg" alt="" width={20} height={20} />
          </button>
        </Swiper>
      </div>
    </section>
  );
}
