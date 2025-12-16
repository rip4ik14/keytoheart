'use client';

import { useEffect, useMemo, useState } from 'react';
import PopularProductsClient from '@components/PopularProductsClient';
import { Product } from '@/types/product';

const FETCH_TIMEOUT_MS = 5000;

type ProductWithPriority = Product & { priority?: boolean };

type FetchState =
  | { status: 'idle' | 'loading'; products: ProductWithPriority[] }
  | { status: 'error'; products: ProductWithPriority[]; error: string };

export default function PopularProductsClientFetch() {
  const [state, setState] = useState<FetchState>({ status: 'idle', products: [] });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const load = async () => {
      setState({ status: 'loading', products: [] });

      try {
        const res = await fetch('/api/popular', {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data: Product[] = await res.json();
        const products: ProductWithPriority[] = Array.isArray(data)
          ? data.map((item, idx) => ({
              ...item,
              images: item.images || [],
              category_ids: (item as any).category_ids || [],
              priority: idx === 0,
            }))
          : [];

        if (isMounted) {
          setState({ status: 'idle', products });
        }
      } catch (err: any) {
        if (isMounted) {
          const message = err?.name === 'AbortError' ? 'Время ожидания истекло' : err?.message || 'Неизвестная ошибка';
          setState({ status: 'error', products: [], error: message });
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    load();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const content = useMemo(() => {
    if (state.status === 'loading') {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-48 rounded-lg bg-gray-200 animate-pulse"
              aria-hidden
            />
          ))}
        </div>
      );
    }

    if (state.status === 'error') {
      return (
        <p className="text-center text-gray-500">Не удалось загрузить популярные товары. Попробуйте обновить страницу.</p>
      );
    }

    if (!state.products.length) {
      return <p className="text-center text-gray-500">Популярных товаров пока нет. Скоро они появятся!</p>;
    }

    return <PopularProductsClient products={state.products} />;
  }, [state]);

  return (
    <section className="w-full max-w-6xl px-2" aria-live="polite">
      <h2 className="text-2xl font-bold mb-5 text-center">Популярные товары</h2>
      {content}
    </section>
  );
}
