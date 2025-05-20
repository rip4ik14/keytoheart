'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

interface Event {
  type: string;
  date: string | null;
  description: string | null;
}

interface Customer {
  id: string;
  phone: string;
  email: string | null;
  created_at: string | null;
  important_dates: Event[];
  orders: any[];
  bonuses: { bonus_balance: number | null; level: string | null };
  bonus_history: any[];
}

interface SortConfig {
  key: keyof Customer | 'order_count' | 'total_spent';
  direction: 'asc' | 'desc';
}

interface Props {
  customers: Customer[];
}

export default function CustomersPage({ customers: initialCustomers }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc',
  });
  const router = useRouter();

  // Функция сортировки
  const handleSort = (key: keyof Customer | 'order_count' | 'total_spent') => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Сортировка и фильтрация клиентов
  const sortedAndFilteredCustomers = customers
    .filter(
      (customer) =>
        customer.phone.toLowerCase().includes(search.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Customer];
      let bValue: any = b[sortConfig.key as keyof Customer];

      if (sortConfig.key === 'order_count') {
        aValue = a.orders.length;
        bValue = b.orders.length;
      } else if (sortConfig.key === 'total_spent') {
        aValue = a.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        bValue = b.orders.reduce((sum, order) => sum + (order.total || 0), 0);
      } else if (sortConfig.key === 'created_at') {
        aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
        bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Клиенты</h1>

      {/* Поиск и фильтры */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Поиск по телефону или email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-lg w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>

      {/* Таблица клиентов */}
      {customers.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Клиенты отсутствуют</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center gap-1">
                    Телефон
                    {sortConfig.key === 'phone' ? (
                      sortConfig.direction === 'asc' ? (
                        <Image src="/icons/sort-up.svg" alt="Sort Up" width={16} height={16} />
                      ) : (
                        <Image src="/icons/sort-down.svg" alt="Sort Down" width={16} height={16} />
                      )
                    ) : (
                      <Image src="/icons/sort.svg" alt="Sort" width={16} height={16} />
                    )}
                  </div>
                </th>
                <th className="p-3 text-left">Email</th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    Дата регистрации
                    {sortConfig.key === 'created_at' ? (
                      sortConfig.direction === 'asc' ? (
                        <Image src="/icons/sort-up.svg" alt="Sort Up" width={16} height={16} />
                      ) : (
                        <Image src="/icons/sort-down.svg" alt="Sort Down" width={16} height={16} />
                      )
                    ) : (
                      <Image src="/icons/sort.svg" alt="Sort" width={16} height={16} />
                    )}
                  </div>
                </th>
                <th className="p-3 text-left">Важные даты</th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('order_count')}
                >
                  <div className="flex items-center gap-1">
                    Кол-во заказов
                    {sortConfig.key === 'order_count' ? (
                      sortConfig.direction === 'asc' ? (
                        <Image src="/icons/sort-up.svg" alt="Sort Up" width={16} height={16} />
                      ) : (
                        <Image src="/icons/sort-down.svg" alt="Sort Down" width={16} height={16} />
                      )
                    ) : (
                      <Image src="/icons/sort.svg" alt="Sort" width={16} height={16} />
                    )}
                  </div>
                </th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('total_spent')}
                >
                  <div className="flex items-center gap-1">
                    Сумма покупок
                    {sortConfig.key === 'total_spent' ? (
                      sortConfig.direction === 'asc' ? (
                        <Image src="/icons/sort-up.svg" alt="Sort Up" width={16} height={16} />
                      ) : (
                        <Image src="/icons/sort-down.svg" alt="Sort Down" width={16} height={16} />
                      )
                    ) : (
                      <Image src="/icons/sort.svg" alt="Sort" width={16} height={16} />
                    )}
                  </div>
                </th>
                <th className="p-3 text-left">Бонусы</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-t hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  <td className="p-3">{customer.phone}</td>
                  <td className="p-3">{customer.email || '—'}</td>
                  <td className="p-3">
                    {customer.created_at
                      ? format(new Date(customer.created_at), 'dd.MM.yyyy', {
                          locale: ru,
                        })
                      : '—'}
                  </td>
                  <td className="p-3">
                    {customer.important_dates.length > 0
                      ? customer.important_dates.map((event, index) => (
                          <div key={index}>
                            {event.type} {event.description && `(${event.description})`}
                            {event.date
                              ? `(${format(new Date(event.date), 'dd.MM.yyyy', { locale: ru })})`
                              : '(Дата не указана)'}
                          </div>
                        ))
                      : '—'}
                  </td>
                  <td className="p-3">{customer.orders.length}</td>
                  <td className="p-3">
                    {customer.orders
                      .reduce((sum, order) => sum + (order.total || 0), 0)
                      .toLocaleString('ru-RU')}{' '}
                    ₽
                  </td>
                  <td className="p-3">
                    {customer.bonuses.bonus_balance ?? 0} ₽ (Уровень:{' '}
                    {customer.bonuses.level ?? '—'})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Серверная часть для загрузки данных
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminJwt } from '@/lib/auth';

export async function getServerSideProps() {
  const cookieStore = await cookies();

  // Очистка некорректных cookies
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.includes('sb-')) {
      console.error('Clearing Supabase cookie:', cookie.name);
      cookieStore.delete(cookie.name);
    }
  }

  // Проверяем admin_session токен
  const token = cookieStore.get('admin_session')?.value;
  console.log('Admin session token:', token); // Отладка
  if (!token) {
    console.error('No admin session token found');
    redirect('/admin/login?error=no-session');
  }

  const isValidToken = await verifyAdminJwt(token);
  console.log('Token verification result:', isValidToken); // Отладка
  if (!isValidToken) {
    console.error('Invalid admin session token');
    redirect('/admin/login?error=invalid-session');
  }

  try {
    // Получаем профили пользователей из user_profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, phone, email, created_at');

    if (profilesError) throw profilesError;

    const customerData: Customer[] = [];

    // Для каждого профиля загружаем связанные данные
    for (const profile of profiles) {
      const phone = profile.phone;
      if (!phone) continue;

      // Важные даты
      const { data: dates } = await supabaseAdmin
        .from('important_dates')
        .select('type, date, description')
        .eq('phone', phone);

      // Заказы
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select(
          `
          id,
          created_at,
          total,
          bonuses_used,
          payment_method,
          status,
          order_items(
            quantity,
            price,
            product_id,
            products(title, cover_url)
          )
        `
        )
        .eq('phone', phone)
        .order('created_at', { ascending: false });

      // Бонусы
      const { data: bonuses } = await supabaseAdmin
        .from('bonuses')
        .select('bonus_balance, level')
        .eq('phone', phone)
        .single();

      // История бонусов
      const { data: bonusHistory } = await supabaseAdmin
        .from('bonus_history')
        .select('amount, reason, created_at')
        .eq('phone', phone)
        .order('created_at', { ascending: false });

      customerData.push({
        id: profile.id,
        phone: phone || '—',
        email: profile.email || null,
        created_at: profile.created_at || null,
        important_dates: dates || [],
        orders: orders || [],
        bonuses: bonuses || { bonus_balance: null, level: null },
        bonus_history: bonusHistory || [],
      });
    }

    return { customers: customerData };
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    toast.error('Ошибка загрузки данных: ' + error.message);
    return { customers: [] };
  }
}