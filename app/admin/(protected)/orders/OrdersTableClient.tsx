'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Database } from '@/lib/supabase/types_new';
import type { PostgrestError } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createBrowserClient } from '@supabase/ssr';
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

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Очистка некорректных cookies и проверка сессии
  useEffect(() => {
    // Проверяем и очищаем некорректные cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'sb-gwbeabfkknhewwoesqax-auth-token' && value) {
        try {
          JSON.parse(value);
        } catch (e) {
          console.error('Clearing invalid cookie:', name);
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      }
    }

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          console.error('No session found:', error);
          router.push('/admin/login?error=no-session');
        }
      } catch (err) {
        console.error('Error checking session:', err);
        router.push('/admin/login?error=session-error');
      }
    };

    checkSession();

    // Слушатель изменений авторизации
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/admin/login?error=session-expired');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    const matchesPhone = searchPhone
      ? order.phone?.includes(searchPhone.replace(/\D/g, '')) ?? false
      : true;
    return matchesStatus && matchesPhone;
  });

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

      // Получаем сессию для JWT-токена
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Не авторизован: Требуется вход');
      }

      const res = await fetch('/api/admin/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const result = await res.json();
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
      if (err.message.includes('Не авторизован')) {
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
            {filteredOrders.map((order) => (
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
                <td className="p-3">{order.phone ? order.phone : '-'}</td>
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