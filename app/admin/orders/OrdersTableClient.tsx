// файл: app/admin/orders/OrdersTableClient.tsx
'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import type { Database } from '@/lib/supabase/types';
import type { PostgrestError } from '@supabase/supabase-js';

type Order = Database['public']['Tables']['orders']['Row'];

interface Props {
  initialOrders: Order[];
  loadError: PostgrestError | null;
}

export default function OrdersTableClient({ initialOrders, loadError }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [error, setError] = useState<string | null>(loadError?.message ?? null);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? 'Ошибка при обновлении статуса');
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (error) {
    return <p className="text-red-600">Ошибка: {error}</p>;
  }

  if (orders.length === 0) {
    return <p className="text-gray-500">Заказов пока нет</p>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="p-3 border-b">Дата</th>
            <th className="p-3 border-b">Имя</th>
            <th className="p-3 border-b">Телефон</th>
            <th className="p-3 border-b">Сумма</th>
            <th className="p-3 border-b">Оплата</th>
            <th className="p-3 border-b">Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t hover:bg-gray-50">
              <td className="p-3">
                {order.created_at
                  ? format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })
                  : '-'}
              </td>
              <td className="p-3">{order.contact_name || '-'}</td>
              <td className="p-3">{order.phone ? `+7 ${order.phone}` : '-'}</td>
              <td className="p-3 font-medium">{order.total?.toLocaleString() ?? 0} ₽</td>
              <td className="p-3">
                {order.payment_method === 'cash' ? 'Наличные' : 'Онлайн'}
              </td>
              <td className="p-3">
                <select
                  value={order.status ?? ''}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="border rounded p-1 text-sm"
                >
                  <option value="Ожидает подтверждения">Ожидает подтверждения</option>
                  <option value="В сборке">В сборке</option>
                  <option value="Доставляется">Доставляется</option>
                  <option value="Доставлен">Доставлен</option>
                  <option value="Отменён">Отменён</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
