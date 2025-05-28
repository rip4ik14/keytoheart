// ✅ Путь: components/ToggleStockButton.tsx
'use client';

import { useTransition } from 'react';
import { toast } from 'react-hot-toast';
import Spinner from '@components/ui/Spinner';

export default function ToggleStockButton({
  id,
  inStock,
  refetch,
}: {
  id: number;
  inStock: boolean;
  refetch: () => void;
}) {
  const [isPending, start] = useTransition();

  const toggle = () =>
    start(async () => {
      const res = await fetch('/api/admin/products/toggle-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        toast.error('Ошибка при изменении статуса');
      } else {
        toast.success('Статус обновлён');
        refetch();
        window.gtag?.('event', 'toggle_stock', {
          event_category: 'admin',
          product_id: id,
          in_stock: !inStock,
        });
        window.ym?.(96644553, 'reachGoal', 'toggle_stock', {
          product_id: id,
          in_stock: !inStock,
        });
      }
    });

  return (
    <button
      onClick={toggle}
      className="rounded-xl border px-3 py-1 text-sm shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black"
      disabled={isPending}
      aria-label={inStock ? 'Скрыть товар' : 'Сделать товар доступным'}
    >
      {isPending ? <Spinner size="1rem" /> : inStock ? 'Скрыть' : 'В наличии'}
    </button>
  );
}