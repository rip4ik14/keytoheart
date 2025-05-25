'use client';

import { useState, useMemo } from 'react';
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

export default function CustomersClient({ customers: initialCustomers }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc',
  });
  const router = useRouter();

  // Сортировка и фильтрация клиентов (мемоизировано)
  const sortedAndFilteredCustomers = useMemo(() => {
    let filtered = customers.filter(
      (customer) =>
        customer.phone.toLowerCase().includes(search.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(search.toLowerCase()))
    );

    filtered.sort((a, b) => {
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

    return filtered;
  }, [customers, search, sortConfig]);

  // UI
  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-6">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Клиенты</h1>

      {/* Поиск и фильтры */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Поиск по телефону или email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-lg w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>

      {/* Таблица клиентов */}
      {sortedAndFilteredCustomers.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Клиенты отсутствуют</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm text-gray-800">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <Th
                  label="Телефон"
                  sortKey="phone"
                  sortConfig={sortConfig}
                  onSort={setSortConfig}
                />
                <th className="p-3 text-left">Email</th>
                <Th
                  label="Дата регистрации"
                  sortKey="created_at"
                  sortConfig={sortConfig}
                  onSort={setSortConfig}
                />
                <th className="p-3 text-left">Важные даты</th>
                <Th
                  label="Кол-во заказов"
                  sortKey="order_count"
                  sortConfig={sortConfig}
                  onSort={setSortConfig}
                />
                <Th
                  label="Сумма покупок"
                  sortKey="total_spent"
                  sortConfig={sortConfig}
                  onSort={setSortConfig}
                />
                <th className="p-3 text-left">Бонусы</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredCustomers.map((customer, i) => (
                <tr
                  key={customer.id}
                  className={
                    "border-t transition-colors cursor-pointer hover:bg-gray-100 " +
                    (i % 2 === 0 ? "bg-white" : "bg-gray-50")
                  }
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                  title="Открыть карточку клиента"
                >
                  <td className="p-3 font-mono">{customer.phone}</td>
                  <td className="p-3">{customer.email || '—'}</td>
                  <td className="p-3">
                    {customer.created_at
                      ? format(new Date(customer.created_at), 'dd.MM.yyyy', { locale: ru })
                      : '—'}
                  </td>
                  <td className="p-3">
                    {customer.important_dates.length > 0
                      ? customer.important_dates.map((event, index) => (
                          <div key={index} className="truncate" title={event.description ?? ''}>
                            <span className="font-medium">{event.type}</span>
                            {event.description && ` (${event.description})`}
                            {event.date
                              ? ` (${format(new Date(event.date), 'dd.MM.yyyy', { locale: ru })})`
                              : ''}
                          </div>
                        ))
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="p-3">{customer.orders.length}</td>
                  <td className="p-3">
                    {customer.orders
                      .reduce((sum, order) => sum + (order.total || 0), 0)
                      .toLocaleString('ru-RU')}{' '}
                    ₽
                  </td>
                  <td className="p-3">
                    <span className="font-semibold">{customer.bonuses.bonus_balance ?? 0} ₽</span>
                    <span className="ml-2 text-gray-500 text-xs">
                      (Уровень: {customer.bonuses.level ?? '—'})
                    </span>
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

// Компонент сортируемого заголовка столбца
function Th({
  label,
  sortKey,
  sortConfig,
  onSort,
}: {
  label: string;
  sortKey: keyof Customer | 'order_count' | 'total_spent';
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
}) {
  const active = sortConfig.key === sortKey;
  return (
    <th
      className="p-3 text-left cursor-pointer select-none hover:bg-gray-200 transition rounded-tl-lg"
      onClick={() =>
        onSort({
          key: sortKey,
          direction: active && sortConfig.direction === 'asc' ? 'desc' : 'asc',
        })
      }
      aria-sort={active ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <div className="flex items-center gap-1">
        {label}
        {active ? (
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
  );
}


