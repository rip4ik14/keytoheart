// ✅ Путь: app/admin/(protected)/orders/OrdersTableClient.tsx
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
      process.env.NODE_ENV !== "production" && console.error('Error updating status:', e);
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
      process.env.NODE_ENV !== "production" && console.error('Error deleting order:', e);
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
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 text-sm sm:text-base">Ошибка: {error}</p>
      </div>
    );
  }
  if (!visibleOrders.length) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-500 text-sm sm:text-base">Заказы не найдены</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Toaster position="top-center" />
      {/* Фильтры */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="statusFilter" className="block mb-1 text-sm font-medium text-gray-700">
            Фильтр по статусу:
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
          >
            <option value="">Все</option>
            <option value="Ожидает подтверждения">Ожидает подтверждения</option>
            <option value="В сборке">В сборке</option>
            <option value="Доставляется">Доставляется</option>
            <option value="Доставлен">Доставлен</option>
            <option value="Отменён">Отменён</option>
          </select>
        </div>
        <div>
          <label htmlFor="searchPhone" className="block mb-1 text-sm font-medium text-gray-700">
            Поиск по телефону:
          </label>
          <input
            id="searchPhone"
            type="text"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
            placeholder="+7..."
          />
        </div>
      </div>

      {/* Таблица для десктопа */}
      <div className="hidden lg:block overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
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
                className="border-t hover:bg-gray-50 text-sm"
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
                <td className="p-3">{order.payment_method === 'cash' ? 'Наличные' : 'Онлайн'}</td>
                <td className="p-3">{order.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}</td>
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
                    className="border border-gray-300 rounded-lg p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
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
                    className="text-red-600 hover:underline text-sm font-medium transition-colors duration-200"
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

      {/* Мобильный вид (карточки) */}
      <div className="lg:hidden space-y-4">
        {visibleOrders.map((order: Order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900">
                Заказ #{order.id}
              </h3>
              <motion.select
                value={displayStatusMap[order.status ?? 'pending'] || 'Ожидает подтверждения'}
                onChange={(e) => updateStatus(order.id, e.target.value)}
                className="border border-gray-300 rounded-lg p-1 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                whileHover={{ scale: 1.05 }}
              >
                <option>Ожидает подтверждения</option>
                <option>В сборке</option>
                <option>Доставляется</option>
                <option>Доставлен</option>
                <option>Отменён</option>
              </motion.select>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
              <div>
                <p className="font-medium">Дата:</p>
                <p>
                  {order.created_at
                    ? format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="font-medium">Имя:</p>
                <p>{order.contact_name || '-'}</p>
              </div>
              <div>
                <p className="font-medium">Телефон:</p>
                <p>{order.phone || '-'}</p>
              </div>
              <div>
                <p className="font-medium">Получатель:</p>
                <p>{order.recipient || '-'}</p>
              </div>
              <div>
                <p className="font-medium">Телефон получателя:</p>
                <p>{order.recipient_phone || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium">Адрес:</p>
                <p>{order.address || '-'}</p>
              </div>
              <div>
                <p className="font-medium">Сумма:</p>
                <p className="font-medium">{order.total?.toLocaleString() ?? '0'} ₽</p>
              </div>
              <div>
                <p className="font-medium">Оплата:</p>
                <p>{order.payment_method === 'cash' ? 'Наличные' : 'Онлайн'}</p>
              </div>
              <div>
                <p className="font-medium">Доставка:</p>
                <p>{order.delivery_method === 'pickup' ? 'Самовывоз' : 'Доставка'}</p>
              </div>
              <div>
                <p className="font-medium">Дата/Время:</p>
                <p>
                  {order.delivery_date && order.delivery_time
                    ? `${order.delivery_date} ${order.delivery_time}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="font-medium">Анонимность:</p>
                <p>{order.anonymous ? 'Да' : 'Нет'}</p>
              </div>
              <div>
                <p className="font-medium">WhatsApp:</p>
                <p>{order.whatsapp ? 'Да' : 'Нет'}</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium">Текст открытки:</p>
                <p>{order.postcard_text || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium">Промокод:</p>
                <p>
                  {order.promo_id
                    ? `Применён (${order.promo_discount?.toLocaleString() ?? 0} ₽)`
                    : 'Не применён'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="font-medium">Товары:</p>
                {order.items.length > 0 ? (
                  <ul className="list-disc pl-4 text-xs">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.title} ×{item.quantity} — {item.price * item.quantity} ₽
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Нет товаров</p>
                )}
              </div>
              <div className="col-span-2">
                <p className="font-medium">Дополнения:</p>
                {order.upsell_details.length > 0 ? (
                  <ul className="list-disc pl-4 text-xs">
                    {order.upsell_details.map((item, idx) => (
                      <li key={idx}>
                        {item.title} ({item.category}) ×{item.quantity} — {item.price} ₽
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Нет дополнений</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                onClick={() => {
                  if (confirm(`Вы уверены, что хотите удалить заказ #${order.id}?`)) {
                    deleteOrder(order.id);
                  }
                }}
                className="text-red-600 hover:underline text-xs font-medium transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Удалить
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}