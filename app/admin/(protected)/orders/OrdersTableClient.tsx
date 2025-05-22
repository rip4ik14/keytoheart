// ✅ Путь: app/admin/orders/OrdersTableClient.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

const STATUS_OPTIONS = [
  'Ожидает подтверждения',
  'В сборке', 
  'Доставляется',
  'Доставлен',
  'Отменён'
] as const;

const PAYMENT_METHOD_LABELS = {
  cash: 'Наличные',
  online: 'Онлайн',
  card: 'Картой'
} as const;

export default function OrdersTableClient({ initialOrders, loadError }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [error, setError] = useState<string | null>(loadError?.message ?? null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchPhone, setSearchPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Проверка admin session при монтировании
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin-session', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!res.ok) {
          throw new Error('Session check failed');
        }
        
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'No admin session');
        }
      } catch (err: any) {
        console.error('Session check failed:', err);
        toast.error('Сессия истекла. Необходима повторная авторизация');
        router.push(`/admin/login?from=${encodeURIComponent('/admin/orders')}`);
      }
    };

    checkSession();
  }, [router]);

  // Фильтрация заказов
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesPhone = !searchPhone || 
        (order.phone && order.phone.toLowerCase().includes(searchPhone.toLowerCase()));
      
      return matchesStatus && matchesPhone;
    });
  }, [orders, statusFilter, searchPhone]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!STATUS_OPTIONS.includes(newStatus as any)) {
      toast.error('Недопустимый статус');
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch('/api/admin/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
        credentials: 'include',
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result?.error ?? 'Ошибка при обновлении статуса');
      }

      // Обновляем локальное состояние
      setOrders(prev =>
        prev.map(order => 
          order.id === id ? { ...order, status: newStatus } : order
        )
      );
      
      toast.success(`Статус заказа обновлён на "${newStatus}"`);
      
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error(err.message || 'Ошибка при обновлении статуса');
      
      if (err.message?.includes('Unauthorized') || err.message?.includes('авторизац')) {
        router.push('/admin/login?error=unauthorized');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch {
      return '-';
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '0 ₽';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return '-';
    return PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] || method;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Ошибка загрузки</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Заказов пока нет</h3>
        <p className="mt-2 text-gray-500">Когда поступят первые заказы, они появятся здесь</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Фильтры и поиск */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Фильтр по статусу
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              aria-label="Фильтр заказов по статусу"
            >
              <option value="">Все статусы</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="searchPhone" className="block text-sm font-medium text-gray-700 mb-2">
              Поиск по телефону
            </label>
            <input
              id="searchPhone"
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Введите номер телефона"
              aria-label="Поиск заказов по номеру телефона"
            />
          </div>
        </div>
        
        {(statusFilter || searchPhone) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Найдено заказов: {filteredOrders.length}
            </p>
            <button
              onClick={() => {
                setStatusFilter('');
                setSearchPhone('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <caption className="sr-only">Список заказов</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата заказа
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клиент
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Оплата
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.contact_name || 'Не указано'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getPaymentMethodLabel(order.payment_method)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status || ''}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      disabled={isLoading}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Изменить статус заказа ${order.id}`}
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}