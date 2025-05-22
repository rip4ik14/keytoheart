'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@components/ProductCard';
import { motion } from 'framer-motion';
import type { Product } from '@/types/product';

export default function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching popular products...');
        const res = await fetch('/api/popular', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Popular products response:', data);
        
        if (!Array.isArray(data)) {
          throw new Error('Неверный формат данных от сервера');
        }
        
        setProducts(data);
      } catch (err: any) {
        console.error('Error fetching popular products:', err);
        setError(err.message || 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16" aria-label="Загрузка популярных товаров">
        <h2 className="mb-10 text-center text-3xl font-bold md:text-4xl">
          Популярное
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16" aria-label="Ошибка загрузки популярных товаров">
        <h2 className="mb-10 text-center text-3xl font-bold md:text-4xl">
          Популярное
        </h2>
        <div className="text-center">
          <p className="text-red-500 mb-4">Ошибка загрузки: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            Попробовать снова
          </button>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16" aria-label="Популярные товары отсутствуют">
        <h2 className="mb-10 text-center text-3xl font-bold md:text-4xl">
          Популярное
        </h2>
        <p className="text-center text-gray-500">
          Популярные товары скоро появятся 🌟
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="popular-products-title">
      <motion.h2
        id="popular-products-title"
        className="mb-10 text-center text-3xl font-bold md:text-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Популярное
      </motion.h2>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
        role="list"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            role="listitem"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}