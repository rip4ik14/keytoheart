// ✅ Путь: app/cart/hooks/useUpsells.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UpsellItem } from '../types';

type UseUpsellsArgs = {
  categoryId: number;
  subcategoryIds: number[];
};

type UpsellProduct = {
  id: string;
  title: string;
  price: number;
  image_url?: string | null;
};

type CacheEntry = {
  ts: number;
  data: UpsellItem[];
};

const CACHE_TTL_MS = 60_000; // 60 сек - чтобы не долбить API на каждом шаге/рефреше
const cache = new Map<string, CacheEntry>();

function normalizeSubIds(subcategoryIds: number[]) {
  // стабильный порядок + чистка
  return Array.from(new Set(subcategoryIds.filter(Boolean))).sort((a, b) => a - b);
}

// ✅ line_id должен быть уникальным на строку корзины
function makeLineId(upsellId: string) {
  return `upsell:${String(upsellId)}`;
}

function toUpsellItem(p: UpsellProduct): UpsellItem {
  const id = String(p.id);

  return {
    line_id: makeLineId(id), // ✅ FIX: обязателен по типу UpsellItem
    id,
    title: p.title,
    price: Number(p.price) || 0,
    image_url: p.image_url ?? undefined,
    isUpsell: true,
    quantity: 1,
  };
}

export function useUpsells({ categoryId, subcategoryIds }: UseUpsellsArgs) {
  const [selectedUpsells, setSelectedUpsells] = useState<UpsellItem[]>([]);
  const [productsBySubcategory, setProductsBySubcategory] = useState<Record<number, UpsellItem[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) делаем стабильный ключ для deps (иначе эффект может триггериться бесконечно)
  const stableSubIds = useMemo(() => normalizeSubIds(subcategoryIds), [subcategoryIds]);
  const subKey = useMemo(() => stableSubIds.join(','), [stableSubIds]);

  const abortRef = useRef<AbortController | null>(null);

  const fetchOne = useCallback(
    async (subId: number, signal: AbortSignal) => {
      const key = `${categoryId}:${subId}`;

      const cached = cache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.data;
      }

      const res = await fetch(`/api/upsell/products?category_id=${categoryId}&subcategory_id=${subId}`, {
        method: 'GET',
        cache: 'no-store',
        signal,
      });

      if (!res.ok) {
        throw new Error(`Upsell fetch failed (${res.status})`);
      }

      const json = await res.json();

      // поддерживаем пару форматов ответа (на всякий)
      const raw: UpsellProduct[] =
        (Array.isArray(json) ? json : null) ??
        (Array.isArray(json?.data) ? json.data : null) ??
        (Array.isArray(json?.products) ? json.products : null) ??
        [];

      const items = raw.map(toUpsellItem);

      cache.set(key, { ts: Date.now(), data: items });
      return items;
    },
    [categoryId],
  );

  // 2) главный эффект: зависит только от categoryId + subKey (строки), а не от массива
  useEffect(() => {
    if (!categoryId || stableSubIds.length === 0) {
      setProductsBySubcategory({});
      setError(null);
      setIsLoading(false);
      return;
    }

    // отменяем прошлые запросы
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let alive = true;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const results = await Promise.all(
          stableSubIds.map(async (subId) => {
            const items = await fetchOne(subId, controller.signal);
            return [subId, items] as const;
          }),
        );

        if (!alive) return;

        const map: Record<number, UpsellItem[]> = {};
        for (const [subId, items] of results) map[subId] = items;

        setProductsBySubcategory(map);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        if (!alive) return;
        setError(e?.message || 'Ошибка загрузки допродаж');
      } finally {
        if (!alive) return;
        setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [categoryId, subKey, stableSubIds, fetchOne]);

  const removeUpsell = useCallback((id: string) => {
    setSelectedUpsells((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const updateUpsellQuantity = useCallback((id: string, quantity: number) => {
    const q = Math.max(1, Math.floor(quantity || 1));
    setSelectedUpsells((prev) => prev.map((x) => (x.id === id ? { ...x, quantity: q } : x)));
  }, []);

  const addUpsell = useCallback((item: UpsellItem) => {
    setSelectedUpsells((prev) => {
      const exists = prev.find((x) => x.id === item.id);
      if (exists) return prev;

      const safeLineId =
        (item as any).line_id && String((item as any).line_id).trim().length > 0
          ? String((item as any).line_id)
          : makeLineId(String(item.id));

      return [...prev, { ...item, line_id: safeLineId, isUpsell: true, quantity: item.quantity ?? 1 }];
    });
  }, []);

  const clearUpsells = useCallback(() => setSelectedUpsells([]), []);

  return {
    selectedUpsells,
    setSelectedUpsells,

    productsBySubcategory,
    isLoadingUpsells: isLoading,
    upsellsError: error,

    addUpsell,
    removeUpsell,
    updateUpsellQuantity,
    clearUpsells,
  };
}