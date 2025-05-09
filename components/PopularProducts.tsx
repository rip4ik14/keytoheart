'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ProductCard from '@components/ProductCard';

interface Product {
  id: number;
  title: string;
  price: number;
  original_price?: number;
  discount_percent?: number;
  in_stock: boolean;
  images: string[];
  category: string;
}

export default function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchPopularProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);

      const start = Date.now();
      const res = await fetch('/api/popular');
      console.log('Fetch duration for /api/popular in PopularProducts:', Date.now() - start, 'ms');

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ошибка загрузки популярных товаров', {
          cause: errorData.details || 'Нет деталей',
        });
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Неверный формат данных');
      }
      setProducts(data);
    } catch (err: any) {
      console.error('Error in PopularProducts:', err);
      setError(err.message);
      setErrorDetails(err.cause || 'Нет дополнительных деталей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularProducts();
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
    window.gtag?.('event', `popular_products_scroll_${dir}`, {
      event_category: 'popular_products',
    });
    window.ym?.(12345678, 'reachGoal', `popular_products_scroll_${dir}`);
  };

  return (
    <section
      className="relative mx-auto max-w-7xl px-4 py-12"
      aria-labelledby="popular-products-title"
    >
      <motion.h2
        id="popular-products-title"
        className="text-center text-2xl md:text-3xl font-sans font-bold mb-8 text-black"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Популярное
      </motion.h2>

      {loading ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 w-full bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </motion.div>
      ) : error ? (
        <div className="text-center font-sans">
          <p className="text-red-500">{error}</p>
          {errorDetails && <p className="text-gray-500 text-sm mt-2">{errorDetails}</p>}
          <motion.button
            onClick={fetchPopularProducts}
            className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-black"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Повторить попытку загрузки популярных товаров"
          >
            Повторить попытку
          </motion.button>
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500 font-sans">
          Популярных товаров пока нет. Скоро они появятся!
        </p>
      ) : (
        <>
          {/* Десктопная версия: сетка */}
          <motion.div
            className="hidden lg:grid grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {products.slice(0, 4).map((p, i) => (
              <motion.div
                key={p.id}
                className="transition-transform duration-300 hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>

          {/* Мобильная версия: карусель */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Прокрутить популярные товары влево"
          >
            <Image src="/icons/chevron-left.svg" alt="Chevron Left" width={20} height={20} className="text-black" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Прокрутить популярные товары вправо"
          >
            <Image src="/icons/chevron-right.svg" alt="Chevron Right" width={20} height={20} className="text-black" />
          </button>

          <motion.div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar py-4 lg:hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            role="region"
            aria-label="Галерея популярных товаров"
          >
            {products.map((p) => (
              <div
                key={p.id}
                className="min-w-[270px] max-w-[270px] flex-shrink-0 transition-transform duration-300 hover:scale-105"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </motion.div>
        </>
      )}
    </section>
  );
}