'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export interface Order {
  id: string;
  created_at: string | null;
  phone: string | null;
  contact_name: string | null;
  total: number | null;
  payment_method: string | null;
  status: string | null;
}

interface Props {
  initialOrders: Order[];
  loadError: string | null;
}

export default function OrdersTableClient({ initialOrders, loadError }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [error, setError] = useState<string | null>(loadError);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchPhone, setSearchPhone] = useState<string>('');
  const router = useRouter();

  // Проверка сессии на клиенте
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin-session', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error('No admin session');
      } catch {
        toast.error('Доступ запрещён');
        router.push(`/admin/login?from=${encodeURIComponent('/admin/orders')}`);
      }
    })();
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Ошибка обновления статуса');

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      toast.success(`Статус заказа #${id} обновлён на «${newStatus}»`);
    } catch (e: any) {
      console.error('Error updating status:', e);
      setError(e.message);
      toast.error(e.message);
      if (/Unauthorized/i.test(e.message)) {
        router.push('/admin/login?error=unauthorized');
      }
    }
  };

  // Фильтрация
  const visibleOrders = orders.filter((o: Order) => {
    const byStatus = !statusFilter || o.status === statusFilter;
    const byPhone = !searchPhone || o.phone?.includes(searchPhone);
    return byStatus && byPhone;
  });

  if (error) {
    return <p className="text-red-600">Ошибка: {error}</p>;
  }
  if (!visibleOrders.length) {
    return <p className="text-gray-500">Заказы не найдены</p>;
  }

  return (
    <div className="space-y-4">
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
          >
            <option value="">Все</option>
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
            placeholder="+7..."
          />
        </div>
      </div>

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
            {visibleOrders.map((order: Order) => (
              <motion.tr
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">
                  {order.created_at
                    ? format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })
                    : '-'}
                </td>
                <td className="p-3">{order.contact_name || '-'}</td>
                <td className="p-3">{order.phone || '-'}</td>
                <td className="p-3 font-medium">{order.total?.toLocaleString() ?? '0'} ₽</td>
                <td className="p-3">
                  {order.payment_method === 'cash' ? 'Наличные' : 'Онлайн'}
                </td>
                <td className="p-3">
                  <motion.select
                    value={order.status ?? ''}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="border rounded p-1 text-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    <option>Ожидает подтверждения</option>
                    <option>В сборке</option>
                    <option>Доставляется</option>
                    <option>Доставлен</option>
                    <option>Отменён</option>
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
