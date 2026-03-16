// ✅ Путь: app/admin/(protected)/customers/CustomersClient.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';

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

  // ✅ marketing consent
  receive_offers: boolean | null;
  receive_offers_at: string | null;
  receive_offers_source: string | null;
  receive_offers_version: string | null;
  receive_offers_ip: string | null;
  receive_offers_ua: string | null;

  important_dates: Event[];
  orders: any[];
  bonuses: { bonus_balance: number | null; level: string | null };
  bonus_history: any[];
  is_registered: boolean;
}

interface SortConfig {
  key:
    | keyof Customer
    | 'order_count'
    | 'total_spent';
  direction: 'asc' | 'desc';
}

interface Props {
  customers: Customer[];
}

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

function BadgeRegistered({ registered }: { registered: boolean }) {
  return (
    <span
      className={cls(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border',
        registered
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      )}
      title={
        registered
          ? 'Есть запись в auth.users (реальная регистрация)'
          : 'Оформлял(а) заказ как гость'
      }
    >
      {registered ? 'Зарегистрирован' : 'Гость'}
    </span>
  );
}

function BadgeConsent({
  granted,
  at,
  source,
  version,
}: {
  granted: boolean;
  at: string | null;
  source: string | null;
  version: string | null;
}) {
  const label = granted ? 'Согласие' : 'Нет согласия';

  const titleParts = [
    granted ? 'Можно отправлять маркетинг' : 'Нельзя отправлять маркетинг',
    at ? `Дата: ${format(new Date(at), 'dd.MM.yyyy HH:mm', { locale: ru })}` : null,
    source ? `Источник: ${source}` : null,
    version ? `Версия: ${version}` : null,
  ].filter(Boolean);

  return (
    <span
      className={cls(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border',
        granted
          ? 'bg-sky-50 text-sky-700 border-sky-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      )}
      title={titleParts.join('\n')}
    >
      {label}
    </span>
  );
}

// Excel-friendly CSV
function toCsvValue(v: any) {
  const s = String(v ?? '').replace(/\r?\n/g, ' ').trim();
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

export default function CustomersClient({ customers: initialCustomers }: Props) {
  const [customers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc',
  });
  const router = useRouter();

  const sortedAndFilteredCustomers = useMemo(() => {
    const filtered = customers.filter(
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
      } else if (sortConfig.key === 'receive_offers_at') {
        aValue = a.receive_offers_at ? new Date(a.receive_offers_at).getTime() : 0;
        bValue = b.receive_offers_at ? new Date(b.receive_offers_at).getTime() : 0;
      }

      if (sortConfig.direction === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

    return filtered;
  }, [customers, search, sortConfig]);

  const handleExportCsv = useCallback(() => {
    const rows = sortedAndFilteredCustomers.map((c) => {
      const orderCount = c.orders?.length ?? 0;
      const totalSpent = (c.orders || []).reduce((sum, o) => sum + (o?.total || 0), 0);
      const importantDates = (c.important_dates || [])
        .map((e) => {
          const dt = e.date ? format(new Date(e.date), 'dd.MM.yyyy', { locale: ru }) : '';
          const desc = e.description ? ` - ${e.description}` : '';
          const datePart = dt ? ` (${dt})` : '';
          return `${e.type}${desc}${datePart}`;
        })
        .join('; ');

      return {
        id: c.id,
        phone: c.phone,
        email: c.email ?? '',
        is_registered: c.is_registered ? 'yes' : 'no',

        receive_offers: c.receive_offers ? 'yes' : 'no',
        receive_offers_at: c.receive_offers_at ?? '',
        receive_offers_source: c.receive_offers_source ?? '',
        receive_offers_version: c.receive_offers_version ?? '',
        receive_offers_ip: c.receive_offers_ip ?? '',
        receive_offers_ua: c.receive_offers_ua ?? '',

        profile_created_at: c.created_at ?? '',
        orders_count: String(orderCount),
        total_spent: String(totalSpent),
        bonus_balance: String(c.bonuses?.bonus_balance ?? 0),
        bonus_level: c.bonuses?.level ?? '',
        important_dates: importantDates,
      };
    });

    const header = [
      'id',
      'phone',
      'email',
      'is_registered',

      'receive_offers',
      'receive_offers_at',
      'receive_offers_source',
      'receive_offers_version',
      'receive_offers_ip',
      'receive_offers_ua',

      'profile_created_at',
      'orders_count',
      'total_spent',
      'bonus_balance',
      'bonus_level',
      'important_dates',
    ];

    const csv =
      '\uFEFF' +
      [
        header.map(toCsvValue).join(';'),
        ...rows.map((r: any) => header.map((k) => toCsvValue(r[k])).join(';')),
      ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const ts = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ru });
    a.href = url;
    a.download = `customers_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }, [sortedAndFilteredCustomers]);

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-6">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Клиенты</h1>

      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Поиск по телефону или email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-lg w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />

        <button
          type="button"
          onClick={handleExportCsv}
          className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          title="Скачает CSV, который открывается в Excel"
        >
          Экспорт в Excel (CSV)
        </button>
      </div>

      {sortedAndFilteredCustomers.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Клиенты отсутствуют</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm text-gray-800">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <Th label="Телефон" sortKey="phone" sortConfig={sortConfig} onSort={setSortConfig} />
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Статус</th>

                {/* ✅ consent */}
                <th className="p-3 text-left">Маркетинг</th>

                <Th label="Дата" sortKey="created_at" sortConfig={sortConfig} onSort={setSortConfig} />
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
              {sortedAndFilteredCustomers.map((customer, i) => {
                const granted = Boolean(customer.receive_offers);

                return (
                  <tr
                    key={customer.id}
                    className={cls(
                      'border-t transition-colors cursor-pointer hover:bg-gray-100',
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    )}
                    onClick={() => router.push(`/admin/customers/${encodeURIComponent(customer.id)}`)}
                    title="Открыть карточку клиента"
                  >
                    <td className="p-3 font-mono">{customer.phone}</td>
                    <td className="p-3">{customer.email || '—'}</td>

                    <td className="p-3">
                      <BadgeRegistered registered={customer.is_registered} />
                    </td>

                    <td className="p-3">
                      <BadgeConsent
                        granted={granted}
                        at={customer.receive_offers_at}
                        source={customer.receive_offers_source}
                        version={customer.receive_offers_version}
                      />
                    </td>

                    <td className="p-3">
                      {customer.created_at
                        ? format(new Date(customer.created_at), 'dd.MM.yyyy', { locale: ru })
                        : '—'}
                    </td>

                    <td className="p-3">
                      {customer.important_dates.length > 0 ? (
                        customer.important_dates.map((event, index) => (
                          <div key={index} className="truncate" title={event.description ?? ''}>
                            <span className="font-medium">{event.type}</span>
                            {event.description && ` (${event.description})`}
                            {event.date
                              ? ` (${format(new Date(event.date), 'dd.MM.yyyy', { locale: ru })})`
                              : ''}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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
      className="p-3 text-left cursor-pointer select-none hover:bg-gray-200 transition"
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