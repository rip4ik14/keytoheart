'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Расширенный интерфейс Order
export interface Order {
  id: string;
  created_at: string | null;
  phone: string | null;
  contact_name: string | null;
  recipient: string | null;
  recipient_phone: string | null;
  address: string | null;
  total: number | null;
  payment_method: string | null;
  status: string | null;
  delivery_method: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  anonymous: boolean | null;
  whatsapp: boolean | null;
  postcard_text: string | null;
  promo_id: string | null;
  promo_discount: number | null;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  upsell_details: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
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

  // Маппинг русскоязычных статусов на значения в базе
  const statusMap: { [key: string]: string } = {
    'Ожидает подтверждения': 'pending',
    'В сборке': 'processing',
    'Доставляется': 'delivering',
    'Доставлен': 'delivered',
    'Отменён': 'canceled',
  };

  // Обратный маппинг для отображения
  const displayStatusMap: { [key: string]: string } = {
    pending: 'Ожидает подтверждения',
    processing: 'В сборке',
    delivering: 'Доставляется',
    delivered: 'Доставлен',
    canceled: 'Отменён',
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const dbStatus = statusMap[newStatus];
      if (!dbStatus) {
        throw new Error('Недопустимый статус');
      }
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId: id, status: dbStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Ошибка обновления статуса');

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: dbStatus } : o))
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

  const deleteOrder = async (id: string) => {
    try {
      const res = await fetch('/api/admin/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Ошибка удаления заказа');

      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success(`Заказ #${id} удалён`);
    } catch (e: any) {
      console.error('Error deleting order:', e);
      setError(e.message);
      toast.error(e.message);
      if (/Unauthorized/i.test(e.message)) {
        router.push('/admin/login?error=unauthorized');
      }
    }
  };

  // Фильтрация
  const visibleOrders = orders.filter((o: Order) => {
    const byStatus = !statusFilter || displayStatusMap[o.status ?? ''] === statusFilter;
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
      <Toaster position="top-center" />
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
              <th className="p-3 border-b">Получатель</th>
              <th className="p-3 border-b">Телефон получателя</th>
              <th className="p-3 border-b">Адрес</th>
              <th className="p-3 border-b">Сумма</th>
              <th className="p-3 border-b">Оплата</th>
              <th className="p-3 border-b">Доставка</th>
              <th className="p-3 border-b">Дата/Время</th>
              <th className="p-3 border-b">Анонимность</th>
              <th className="p-3 border-b">WhatsApp</th>
              <th className="p-3 border-b">Текст открытки</th>
              <th className="p-3 border-b">Промокод</th>
              <th className="p-3 border-b">Товары</th>
              <th className="p-3 border-b">Дополнения</th>
              <th className="p-3 border-b">Статус</th>
              <th className="p-3 border-b">Действия</th>
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
                <td className="p-3">{order.recipient || '-'}</td>
                <td className="p-3">{order.recipient_phone || '-'}</td>
                <td className="p-3">{order.address || '-'}</td>
                <td className="p-3 font-medium">{order.total?.toLocaleString() ?? '0'} ₽</td>
                <td className="p-3">
                  {order.payment_method === 'cash' ? 'Наличные' : 'Онлайн'}
                </td>
                <td className="p-3">
                  {order.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}
                </td>
                <td className="p-3">
                  {order.delivery_date && order.delivery_time
                    ? `${order.delivery_date} ${order.delivery_time}`
                    : '-'}
                </td>
                <td className="p-3">{order.anonymous ? 'Да' : 'Нет'}</td>
                <td className="p-3">{order.whatsapp ? 'Да' : 'Нет'}</td>
                <td className="p-3">{order.postcard_text || '-'}</td>
                <td className="p-3">
                  {order.promo_id
                    ? `Применён (${order.promo_discount?.toLocaleString() ?? 0} ₽)`
                    : 'Не применён'}
                </td>
                <td className="p-3">
                  {order.items.length > 0 ? (
                    <ul className="list-disc pl-4">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.title} ×{item.quantity} — {item.price * item.quantity} ₽
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'Нет товаров'
                  )}
                </td>
                <td className="p-3">
                  {order.upsell_details.length > 0 ? (
                    <ul className="list-disc pl-4">
                      {order.upsell_details.map((item, idx) => (
                        <li key={idx}>
                          {item.title} ({item.category}) ×{item.quantity} — {item.price} ₽
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'Нет дополнений'
                  )}
                </td>
                <td className="p-3">
                  <motion.select
                    value={displayStatusMap[order.status ?? 'pending'] || 'Ожидает подтверждения'}
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
                <td className="p-3">
                  <motion.button
                    onClick={() => {
                      if (confirm(`Вы уверены, что хотите удалить заказ #${order.id}?`)) {
                        deleteOrder(order.id);
                      }
                    }}
                    className="text-red-600 hover:underline text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Удалить
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}