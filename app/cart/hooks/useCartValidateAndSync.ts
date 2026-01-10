// app/cart/hooks/useCartValidateAndSync.ts
'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import type { CartItemType } from '../types';

type Args = {
  items: CartItemType[];
  clearCart: () => void;
  addMultipleItems: (items: CartItemType[]) => void;
};

export function useCartValidateAndSync({ items, clearCart, addMultipleItems }: Args) {
  useEffect(() => {
    let aborted = false;

    const run = async () => {
      if (!items || items.length === 0) return;

      const payloadItems = items
        .filter((i) => !i.isUpsell)
        .map((i) => ({
          id: parseInt(i.id, 10),
          quantity: i.quantity,
          price: i.price,
        }))
        .filter((i) => !Number.isNaN(i.id));

      if (payloadItems.length === 0) return;

      try {
        const res = await fetch('/api/products/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: payloadItems }),
        });

        const json = await res.json();
        if (aborted) return;

        // если все ок - ничего не делаем
        if (res.ok && json.valid) return;

        const invalidItems = (json.invalidItems || []) as Array<{ id: number; reason: string }>;
        if (!invalidItems.length) return;

        // 1) удалить недоступные
        const removeIds = invalidItems
          .filter((x) => {
            const r = x.reason || '';
            return (
              r.includes('Товар не найден') ||
              r.includes('отсутствует в наличии') ||
              r.includes('не доступен для заказа')
            );
          })
          .map((x) => String(x.id));

        // 2) обновить цены, если изменились
        const priceUpdates = invalidItems
          .map((x) => {
            if (!x.reason?.includes('Цена изменилась')) return null;
            const match = x.reason.match(/текущая (\d+)/);
            if (!match) return null;
            return { id: x.id, newPrice: parseInt(match[1], 10) };
          })
          .filter(Boolean) as Array<{ id: number; newPrice: number }>;

        // собираем updatedItems на базе текущих items
        let updated = [...items];

        if (removeIds.length) {
          const removedTitles = updated
            .filter((it) => removeIds.includes(it.id))
            .map((it) => it.title)
            .join(', ');

          updated = updated.filter((it) => !removeIds.includes(it.id));
          toast.error(`Следующие товары больше не доступны и были удалены из корзины: ${removedTitles}`);
        }

        if (priceUpdates.length) {
          updated = updated.map((it) => {
            const pid = parseInt(it.id, 10);
            const upd = priceUpdates.find((u) => u.id === pid);
            if (!upd) return it;
            toast(`Цена товара "${it.title}" обновлена до ${upd.newPrice} ₽`);
            return { ...it, price: upd.newPrice };
          });
        }

        // применяем только если реально поменялось
        const changed = updated.length !== items.length ||
          updated.some((u, idx) => u.id !== items[idx]?.id || u.price !== items[idx]?.price);

        if (changed) {
          clearCart();
          if (updated.length) addMultipleItems(updated);
        }
      } catch (e) {
        if (aborted) return;
        toast.error('Не удалось проверить товары в корзине.');
      }
    };

    run();

    return () => {
      aborted = true;
    };
  }, [items, clearCart, addMultipleItems]);
}
