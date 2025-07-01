'use client';

import React, { useEffect, useState } from 'react';
// Swiper will be loaded lazily
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let Swiper: any, SwiperSlide: any, Navigation: any;
import 'swiper/css';
import 'swiper/css/navigation';
import ProductCard from '@components/ProductCard';
import { Product } from '@/types/product';
import { claimPriority } from '@/utils/imagePriority';
import Image from 'next/image';

export default function PopularProductsClient({ products }: { products: Product[] }) {
  const [swiperLoaded, setSwiperLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [swReact, swModules] = await Promise.all([
        import('swiper/react'),
        import('swiper/modules'),
      ]);
      if (!mounted) return;
      Swiper = swReact.Swiper;
      SwiperSlide = swReact.SwiperSlide;
      Navigation = swModules.Navigation;
      setSwiperLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);
  if (!products || products.length === 0) {
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

  if (!swiperLoaded) {
    return (
      <section className="relative mx-auto max-w-7xl px-4 py-12" aria-labelledby="popular-products-title">
        <h2
          id="popular-products-title"
          className="text-center text-2xl md:text-3xl font-sans font-bold mb-8 text-black"
        >
          ПОПУЛЯРНОЕ
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {prepared.map((p, idx) => {
            const shouldPrioritize = idx === 0 && claimPriority();
            return (
              <div key={p.id} className="flex justify-center">
                <ProductCard product={p} priority={shouldPrioritize} />
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-12" aria-labelledby="popular-products-title">
      <h2
        id="popular-products-title"
        className="text-center text-2xl md:text-3xl font-sans font-bold mb-8 text-black"
      >
        ПОПУЛЯРНОЕ
      </h2>
      <div className="relative min-h-[400px]"> {/* резервируем место для swiper */}
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
          <button
            className="popular-prev absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Прокрутить популярные товары влево"
          >
            <Image src="/icons/chevron-left.svg" alt="Chevron Left" width={20} height={20} />
          </button>
          <button
            className="popular-next absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Прокрутить популярные товары вправо"
          >
            <Image src="/icons/chevron-right.svg" alt="Chevron Right" width={20} height={20} />
          </button>
        </Swiper>
      </div>
    </section>
  );
}
