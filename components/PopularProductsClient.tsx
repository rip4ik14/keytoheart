'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import ProductCard from '@components/ProductCard';
import { Product } from '@/types/product';
import { claimPriority } from '@/utils/imagePriority';

/* -------- Swiper → динамический импорт, чтобы не грузить heavy-JS в initial bundle -------- */
const Swiper = dynamic(() => import('swiper/react').then((m) => m.Swiper), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse bg-gray-100 rounded-xl" />,
});
const SwiperSlide = dynamic(() => import('swiper/react').then((m) => m.SwiperSlide), {
  ssr: false,
});

import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

/* ------------------------------------------------------------------ */
interface Props {
  products: Product[];
}

export default function PopularProductsClient({ products }: Props) {
  if (!products?.length) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-center text-gray-500">Популярных товаров пока нет. Скоро они появятся!</p>
      </section>
    );
  }

  const prepared = products.map((item) => ({
    ...item,
    images: item.images || [],
    category_ids: item.category_ids || [],
  }));

  const enableLoop = prepared.length > 4;

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-12" aria-labelledby="popular-products-title">
      <h2 id="popular-products-title" className="mb-8 text-center font-sans text-2xl md:text-3xl font-bold">
        ПОПУЛЯРНОЕ
      </h2>

      <div className="relative">
        <Swiper
          modules={[Navigation]}
          loop={enableLoop}
          navigation={{ nextEl: '.popular-next', prevEl: '.popular-prev' }}
          slidesPerView={1}
          spaceBetween={16}
          breakpoints={{
            640: { slidesPerView: 2.2, spaceBetween: 16 },
            1024: { slidesPerView: 4, spaceBetween: 24 },
          }}
          className="group"
        >
          {prepared.map((p, idx) => {
            const shouldPrioritize = idx === 0 && claimPriority();
            return (
              <SwiperSlide key={p.id} className="flex justify-center">
                <ProductCard product={p} priority={shouldPrioritize} />
              </SwiperSlide>
            );
          })}

          {/* навигационные кнопки */}
          <button
            className="popular-prev absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Прокрутить популярные товары влево"
          >
            <Image src="/icons/chevron-left.svg" alt="" width={20} height={20} />
          </button>
          <button
            className="popular-next absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Прокрутить популярные товары вправо"
          >
            <Image src="/icons/chevron-right.svg" alt="" width={20} height={20} />
          </button>
        </Swiper>
      </div>
    </section>
  );
}
