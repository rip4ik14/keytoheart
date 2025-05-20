'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Database } from '@/lib/supabase/types_new';
import type { PostgrestError } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type Order = Database['public']['Tables']['orders']['Row'];

interface Props {
  initialOrders: Order[];
  loadError: PostgrestError | null;
}

export default function OrdersTableClient({ initialOrders, loadError }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [error, setError] = useState<string | null>(loadError?.message ?? null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchPhone, setSearchPhone] = useState<string>('');
  const router = useRouter();

  // Проверка наличия admin_session токена
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/check-admin-session', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        console.log('Session check response:', data); // Отладка
        if (!res.ok) {
          throw new Error(data.error || 'No admin session');
        }
      } catch (err: any) {
        console.error('Session check failed:', err);
        router.push('/admin/login?error=no-session');
      }
    };

    checkSession();
  }, [router]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const validStatuses = [
        'Ожидает подтверждения',
        'В сборке',
        'Доставляется',
        'Доставлен',
        'Отменён',
      ];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Недопустимый статус');
      }

      const res = await fetch('/api/admin/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
        credentials: 'include',
      });

      const result = await res.json();
      console.log('Update status response:', result); // Отладка
      if (!res.ok) {
        throw new Error(result?.error ?? 'Ошибка при обновлении статуса');
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      toast.success(`Статус заказа #${id} обновлён на "${newStatus}"`);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message);
      toast.error(err.message);
      if (err.message.includes('Unauthorized')) {
        router.push('/admin/login?error=unauthorized');
      }
    }
  };

  if (error) {
    return <p className="text-red-600">Ошибка: {error}</p>;
  }

  if (orders.length === 0) {
    return <p className="text-gray-500">Заказов пока нет</p>;
  }

  return (
    <div className="space-y-4">
      {/* Фильтры и поиск */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="statusFilter" className="block mb-1 text-sm">
            Фильтр по статусу:
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 border rounded"
            aria-label="Фильтр заказов по статусу"
          >
            <option value="">Все статусы</option>
            <option value="Ожидает подтверждения">Ожидает подтверждения</option>
            <option value="В сборке">В сборке</option>
            <option value="Доставляется">Доставляется</option>
            <option value="Доставлен">Доставлен</option>
            <option value="Отменён">Отменён</option>
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="searchPhone" className="block mb-1 text-sm">
            Поиск по телефону:
          </label>
          <input
            id="searchPhone"
            type="text"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Введите номер телефона"
            aria-label="Поиск заказов по номеру телефона"
          />
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <caption className="sr-only">Список заказов</caption>
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th scope="col" className="p-3 border-b">Дата</th>
              <th scope="col" className="p-3 border-b">Имя</th>
              <th scope="col" className="p-3 border-b">Телефон</th>
              <th scope="col" className="p-3 border-b">Сумма</th>
              <th scope="col" className="p-3 border-b">Оплата</th>
              <th scope="col" className="p-3 border-b">Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <motion.tr
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">
                  {order.created_at
                    ? format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })
                    : '-'}
                </td>
                <td className="p-3">{order.contact_name || '-'}</td>
                <td className="p-3">{order.phone || '-'}</td>
                <td className="p-3 font-medium">{order.total?.toLocaleString() ?? 0} ₽</td>
                <td className="p-3">
                  {order.payment_method === 'cash' ? 'Наличные' : 'Онлайн'}
                </td>
                <td className="p-3">
                  <motion.select
                    value={order.status ?? ''}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="border rounded p-1 text-sm"
                    aria-label={`Изменить статус заказа ${order.id}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <option value="Ожидает подтверждения">Ожидает подтверждения</option>
                    <option value="В сборке">В сборке</option>
                    <option value="Доставляется">Доставляется</option>
                    <option value="Доставлен">Доставлен</option>
                    <option value="Отменён">Отменён</option>
                  </motion.select>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}