'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { supabasePublic } from '@/lib/supabase/public';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: number;
  title: string;
  price: number;
  images: string[];
  category: string;
}

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
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
      const { data } = await supabasePublic
        .from('products')
        .select('id, title, price, images, category')
        .or(`title.ilike.%${query}%,short_desc.ilike.%${query}%`)
        .eq('in_stock', true)
        .limit(10)
        .abortSignal(controller.signal);
      setResults(
        data
          ? data.map((item) => ({
              ...item,
              images: item.images || [],
              category: item.category || '',
            }))
          : []
      );
      setLoading(false);
      window.gtag?.('event', 'search_query', { event_category: 'search', query });
      window.ym?.(12345678, 'reachGoal', 'search_query', { query });
    };

    const timer = setTimeout(() => {
      fetchProducts().catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
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
      className="relative w-full max-w-2xl rounded-2xl bg-white shadow-lg"
      role="dialog"
      aria-label="Поиск по сайту"
      aria-modal="true"
    >
      {/* Кнопка закрытия вне input */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-gray-100 transition"
        aria-label="Закрыть поиск"
      >
        <Image src="/icons/close.svg" alt="Закрыть" width={20} height={20} />
      </button>

      {/* Поле ввода */}
      <div className="flex items-center gap-2 py-3 px-4">
        <Image src="/icons/search.svg" alt="Поиск" width={20} height={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по сайту"
          className="w-full bg-transparent focus:outline-none text-black placeholder-gray-400 text-sm"
        />
      </div>

      {/* Результаты поиска */}
      <div className="max-h-80 overflow-y-auto">
        <AnimatePresence>
          {loading && (
            <motion.p
              className="text-gray-500 flex items-center gap-2 px-4 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              role="status"
            >
              Ничего не найдено
            </motion.p>
          )}

          {results.map((p) => (
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
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
              >
                <img
                  src={p.images?.[0] || '/no-image.png'}
                  alt={p.title}
                  className="w-10 h-10 object-cover rounded"
                />
                <div className="flex-1">
                  <span className="text-sm text-black">{p.title}</span>
                  <span className="block text-xs text-gray-600">{p.price} ₽</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
