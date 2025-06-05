'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { supabasePublic } from '@/lib/supabase/public';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Product {
  id: number;
  title: string;
  price: number;
  images: string[];
  category_ids: number[];
}

interface Category {
  id: number;
  name: string;
}

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);

      const { data: productsData, error: productsError } = await supabasePublic
        .from('products')
        .select('id, title, price, images')
        .or(`title.ilike.%${query}%,short_desc.ilike.%${query}%`)
        .eq('in_stock', true)
        .limit(10)
        .abortSignal(controller.signal);

      if (productsError) {
        process.env.NODE_ENV !== "production" && console.error('Error fetching products:', productsError);
        setResults([]);
        setLoading(false);
        return;
      }

      if (!productsData || productsData.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Fetch category IDs for all products
      const productIds = productsData.map(p => p.id);
      const { data: categoryData, error: categoryError } = await supabasePublic
        .from('product_categories')
        .select('product_id, category_id')
        .in('product_id', productIds);

      if (categoryError) {
        process.env.NODE_ENV !== "production" && console.error('Error fetching product categories:', categoryError);
        setResults([]);
        setLoading(false);
        return;
      }

      // Group category IDs by product ID
      const productCategoriesMap = new Map<number, number[]>();
      categoryData.forEach(item => {
        const existing = productCategoriesMap.get(item.product_id) || [];
        productCategoriesMap.set(item.product_id, [...existing, item.category_id]);
      });

      // Fetch category names
      const allCategoryIds = Array.from(new Set(categoryData.map(item => item.category_id)));
      const { data: categoriesData, error: categoriesError } = await supabasePublic
        .from('categories')
        .select('id, name')
        .in('id', allCategoryIds);

      if (categoriesError) {
        process.env.NODE_ENV !== "production" && console.error('Error fetching categories:', categoriesError);
        setResults([]);
        setLoading(false);
        return;
      }

      const map = new Map<number, string>();
      categoriesData.forEach(cat => map.set(cat.id, cat.name));
      setCategoriesMap(map);

      const productsWithCategories = productsData.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        images: item.images || [],
        category_ids: productCategoriesMap.get(item.id) || [],
      }));

      setResults(productsWithCategories);
      setLoading(false);

      window.gtag?.('event', 'search_query', { event_category: 'search', query });
      window.ym?.(96644553, 'reachGoal', 'search_query', { query });
    };

    const timer = setTimeout(() => {
      fetchProducts().catch((err) => {
        if (err.name !== 'AbortError') process.env.NODE_ENV !== "production" && console.error(err);
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="relative w-full max-w-2xl bg-white rounded-2xl shadow-lg"
      role="dialog"
      aria-modal="true"
      aria-label="Поиск по сайту"
    >
      {/* Кнопка закрытия */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-2 text-black hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-black"
        aria-label="Закрыть поиск"
      >
        <X size={20} />
      </button>

      {/* Инпут поиска */}
      <div className="flex items-center gap-2 py-3 px-4">
        <Image src="/icons/search.svg" alt="Поиск" width={20} height={20} className="text-black" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по сайту"
          className="w-full bg-transparent outline-none text-black placeholder-gray-400 text-sm"
          aria-label="Введите запрос для поиска"
        />
      </div>

      {/* Результаты */}
      <div className="max-h-80 overflow-y-auto" role="list" aria-label="Результаты поиска">
        <AnimatePresence>
          {loading && (
            <motion.p
              className="text-gray-500 flex items-center gap-2 px-4 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="status"
            >
              <Image
                src="/icons/spinner.svg"
                alt="Загрузка"
                width={20}
                height={20}
                className="animate-spin"
              />
              Загрузка...
            </motion.p>
          )}

          {!loading && results.length === 0 && query && (
            <motion.p
              className="text-gray-500 px-4 py-2 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="status"
            >
              Ничего не найдено
            </motion.p>
          )}

          {results.map((p) => {
            const categoryNames = p.category_ids
              .map(id => categoriesMap.get(id) || '—')
              .join(', ');

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                role="listitem"
              >
                <Link
                  href={`/product/${p.id}`}
                  onClick={() => {
                    onClose();
                    window.gtag?.('event', 'search_result_click', {
                      event_category: 'search',
                      product_id: p.id,
                    });
                    window.ym?.(96644553, 'reachGoal', 'search_result_click', {
                      product_id: p.id,
                    });
                  }}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                  aria-label={`Перейти к товару ${p.title}`}
                >
                  <Image
                    src={p.images?.[0] || '/no-image.png'}
                    alt={p.title}
                    className="w-10 h-10 object-cover rounded"
                    loading="lazy"
                    width={40}
                    height={40}
                  />
                  <div className="flex-1">
                    <span className="text-sm text-black">{p.title}</span>
                    <span className="block text-xs text-gray-600">{p.price} ₽</span>
                    <span className="block text-xs text-gray-500">{categoryNames}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}