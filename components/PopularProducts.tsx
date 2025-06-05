'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import ProductCard from '@components/ProductCard';
import { supabasePublic } from '@/lib/supabase/public';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Product } from '@/types/product';
import Image from 'next/image';

export default function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const fetchPopularProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);

      const res = await fetch('/api/popular', { next: { revalidate: 60 } });
      if (!res.ok) {
        const errorData = await res.json();
        const error = new Error(errorData.error || 'Ошибка загрузки популярных товаров');
        (error as any).cause = errorData.details || 'Нет деталей';
        throw error;
      }
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Неверный формат данных');

      setProducts(
        data.map((item: any) => ({
          ...item,
          category_ids: item.category_ids || [],
        }))
      );
    } catch (err: any) {
      setError(err.message);
      setErrorDetails((err as any).cause || 'Нет дополнительных деталей');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularProducts();
    const channel = supabasePublic
      .channel('products-popular-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: 'is_popular=true' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          fetchPopularProducts();
        }
      )
      .subscribe();
    return () => {
      supabasePublic.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 w-full bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center font-sans">
          <p className="text-red-500">{error}</p>
          {errorDetails && <p className="text-gray-500 text-sm mt-2">{errorDetails}</p>}
          <button
            onClick={fetchPopularProducts}
            className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Повторить попытку загрузки популярных товаров"
          >
            Повторить попытку
          </button>
        </div>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-center text-gray-500">Популярных товаров пока нет. Скоро они появятся!</p>
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
      <div className="relative">
        <Swiper
          modules={[Navigation]}
          loop={true}
          navigation={{
            nextEl: '.popular-next',
            prevEl: '.popular-prev',
          }}
          slidesPerView={1}
          spaceBetween={16}
          breakpoints={{
            640: { slidesPerView: 2.2, spaceBetween: 16 },
            1024: { slidesPerView: 4, spaceBetween: 24 },
          }}
          className="group"
        >
          {products.map((p) => (
            <SwiperSlide key={p.id} className="flex justify-center">
              <ProductCard product={p} />
            </SwiperSlide>
          ))}
          {/* Стрелки */}
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
