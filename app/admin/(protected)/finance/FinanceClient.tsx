// ✅ Путь: app/admin/(protected)/stats/StatsClient.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, subDays, differenceInCalendarDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Order = {
  id: string;
  total: number | null;
  created_at: string;
  phone: string | null;
  promo_code: string | null;
  status?: string | null; // важно для фильтра выручки (delivered)
};

type OrderItem = {
  order_id?: string | null;
  product_id: number;
  quantity: number;
  price: number;
  title: string;
};

type Customer = {
  id: string;
  phone: string;
  created_at: string;
};

type BonusHistory = {
  amount: number;
  reason: string;
  created_at: string;
};

type PromoCode = {
  code: string;
  discount: number;
  created_at: string | null;
};

interface Props {
  initialOrders: Order[];
  initialItems: OrderItem[];
  initialCustomers: Customer[];
  initialBonusHistory: BonusHistory[];
  initialPromoCodes: PromoCode[];
}

type Granularity = 'day' | 'week' | 'month';

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function percentDelta(current: number, prev: number) {
  if (prev === 0 && current === 0) return 0;
  if (prev === 0) return 100;
  return ((current - prev) / prev) * 100;
}

function formatDelta(deltaPct: number) {
  const sign = deltaPct > 0 ? '+' : '';
  return `${sign}${Math.round(deltaPct)}%`;
}

function toRubInt(v: any) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

function formatRub(n: number) {
  return `${toRubInt(n).toLocaleString('ru-RU')} ₽`;
}

function isDelivered(status?: string | null) {
  return String(status ?? '').toLowerCase() === 'delivered';
}

function isCanceled(status?: string | null) {
  return String(status ?? '').toLowerCase() === 'canceled';
}

export default function StatsClient({
  initialOrders,
  initialItems,
  initialCustomers,
  initialBonusHistory,
  initialPromoCodes,
}: Props) {
  const router = useRouter();

  const [period, setPeriod] = useState<number>(30);
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [useCustomRange, setUseCustomRange] = useState(false);

  const [granularity, setGranularity] = useState<Granularity>('day');

  useEffect(() => {
    const saved = localStorage.getItem('statsPeriod');
    if (saved) setPeriod(Number(saved));
    const savedGran = localStorage.getItem('statsGranularity') as Granularity | null;
    if (savedGran) setGranularity(savedGran);
  }, []);

  useEffect(() => {
    localStorage.setItem('statsPeriod', String(period));
  }, [period]);

  useEffect(() => {
    localStorage.setItem('statsGranularity', granularity);
  }, [granularity]);

  const glassShell =
    'rounded-3xl border border-white/20 bg-white/60 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]';
  const glassHeader =
    'rounded-3xl border border-white/20 bg-white/55 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]';
  const inputBase =
    'border border-white/25 bg-white/60 backdrop-blur-xl rounded-full px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-black/10 focus:border-white/40';
  const selectBase =
    'border border-white/25 bg-white/60 backdrop-blur-xl rounded-full px-3 py-2 text-sm outline-none shadow-sm focus:ring-2 focus:ring-black/10 focus:border-white/40';
  const btnPrimary =
    'inline-flex items-center justify-center rounded-full bg-black/90 text-white px-4 py-2 text-sm font-semibold hover:bg-black transition shadow-sm';
  const hintText = 'text-xs text-gray-600';

  const dateRange = useMemo(() => {
    let startDate: Date;
    let endDate: Date = new Date();

    if (useCustomRange) {
      startDate = startOfDay(new Date(customStartDate));
      endDate = endOfDay(new Date(customEndDate));
    } else {
      startDate = period === 9999 ? new Date(0) : subDays(new Date(), period);
      startDate = startOfDay(startDate);
      endDate = endOfDay(endDate);
    }

    return { startDate, endDate };
  }, [period, useCustomRange, customStartDate, customEndDate]);

  const prevDateRange = useMemo(() => {
    const { startDate, endDate } = dateRange;

    const daysLen = clamp(differenceInCalendarDays(endDate, startDate) + 1, 1, 3650);
    const prevEnd = endOfDay(subDays(startDate, 1));
    const prevStart = startOfDay(subDays(prevEnd, daysLen - 1));

    return { startDate: prevStart, endDate: prevEnd, daysLen };
  }, [dateRange]);

  // Важно:
  // - для выручки/графиков/среднего чека берем только delivered
  // - canceled исключаем полностью
  const filteredOrdersAll = useMemo(() => {
    const { startDate, endDate } = dateRange;

    return initialOrders.filter((o) => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      if (d < startDate || d > endDate) return false;
      if (isCanceled(o.status)) return false;
      return true;
    });
  }, [initialOrders, dateRange]);

  const filteredOrdersRevenue = useMemo(() => {
    // если status не приходит - считаем как delivered (иначе статистика станет нулевой),
    // но правильный вариант - передавать status с сервера
    const hasStatus = initialOrders.some((o) => typeof o.status !== 'undefined');
    if (!hasStatus) return filteredOrdersAll;

    return filteredOrdersAll.filter((o) => isDelivered(o.status));
  }, [filteredOrdersAll, initialOrders]);

  const prevFilteredOrdersAll = useMemo(() => {
    const { startDate, endDate } = prevDateRange;

    return initialOrders.filter((o) => {
      if (!o.created_at) return false;
      const d = new Date(o.created_at);
      if (d < startDate || d > endDate) return false;
      if (isCanceled(o.status)) return false;
      return true;
    });
  }, [initialOrders, prevDateRange]);

  const prevFilteredOrdersRevenue = useMemo(() => {
    const hasStatus = initialOrders.some((o) => typeof o.status !== 'undefined');
    if (!hasStatus) return prevFilteredOrdersAll;

    return prevFilteredOrdersAll.filter((o) => isDelivered(o.status));
  }, [prevFilteredOrdersAll, initialOrders]);

  const filteredCustomers = useMemo(() => {
    const { startDate, endDate } = dateRange;

    return initialCustomers.filter((c) => {
      const d = new Date(c.created_at);
      return d >= startDate && d <= endDate;
    });
  }, [initialCustomers, dateRange]);

  const prevFilteredCustomers = useMemo(() => {
    const { startDate, endDate } = prevDateRange;

    return initialCustomers.filter((c) => {
      const d = new Date(c.created_at);
      return d >= startDate && d <= endDate;
    });
  }, [initialCustomers, prevDateRange]);

  const filteredBonusHistory = useMemo(() => {
    const { startDate, endDate } = dateRange;

    return initialBonusHistory.filter((b) => {
      const d = new Date(b.created_at);
      return d >= startDate && d <= endDate;
    });
  }, [initialBonusHistory, dateRange]);

  const prevFilteredBonusHistory = useMemo(() => {
    const { startDate, endDate } = prevDateRange;

    return initialBonusHistory.filter((b) => {
      const d = new Date(b.created_at);
      return d >= startDate && d <= endDate;
    });
  }, [initialBonusHistory, prevDateRange]);

  const groupedOrders = useMemo(() => {
    const map = new Map<string, { date: string; count: number; revenue: number; sortKey: number }>();

    const getBucket = (dt: Date) => {
      if (granularity === 'month') {
        const key = format(dt, 'MM.yyyy', { locale: ru });
        const sortKey = Number(format(dt, 'yyyyMM'));
        return { label: key, sortKey };
      }

      if (granularity === 'week') {
        const day = dt.getDay();
        const diffToMon = (day + 6) % 7;
        const monday = subDays(startOfDay(dt), diffToMon);
        const label = format(monday, 'dd.MM.yy', { locale: ru });
        const sortKey = monday.getTime();
        return { label, sortKey };
      }

      const label = format(dt, 'dd.MM.yy', { locale: ru });
      const sortKey = startOfDay(dt).getTime();
      return { label, sortKey };
    };

    // В графиках - только выручка по delivered
    filteredOrdersRevenue.forEach((o) => {
      if (!o.created_at) return;
      const dt = new Date(o.created_at);
      const bucket = getBucket(dt);
      const cur = map.get(bucket.label) ?? { date: bucket.label, count: 0, revenue: 0, sortKey: bucket.sortKey };

      cur.count += 1;
      cur.revenue += toRubInt(o.total ?? 0);
      map.set(bucket.label, cur);
    });

    return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredOrdersRevenue, granularity]);

  const topProducts = useMemo(() => {
    const hasOrderId = initialItems.some((i) => typeof i.order_id !== 'undefined');
    const orderIdsInRange = new Set(filteredOrdersRevenue.map((o) => o.id));

    const itemsScoped = hasOrderId
      ? initialItems.filter((i) => i.order_id && orderIdsInRange.has(i.order_id))
      : initialItems;

    const m = new Map<number, { product_id: number; quantity: number; total: number; title: string }>();

    itemsScoped.forEach((i) => {
      const entry = m.get(i.product_id) ?? { product_id: i.product_id, quantity: 0, total: 0, title: i.title };
      entry.quantity += i.quantity;
      entry.total += toRubInt(i.quantity * i.price);
      m.set(i.product_id, entry);
    });

    return Array.from(m.values()).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [initialItems, filteredOrdersRevenue]);

  const customerStats = useMemo(() => {
    const phoneOrderCount = new Map<string, number>();

    filteredOrdersRevenue.forEach((o) => {
      if (!o.phone) return;
      phoneOrderCount.set(o.phone, (phoneOrderCount.get(o.phone) || 0) + 1);
    });

    const repeatCustomers = Array.from(phoneOrderCount.values()).filter((c) => c > 1).length;

    const totalLTV = filteredOrdersRevenue.reduce((sum, o) => sum + toRubInt(o.total ?? 0), 0);
    const avgLTV = phoneOrderCount.size > 0 ? totalLTV / phoneOrderCount.size : 0;

    return {
      newCustomers: filteredCustomers.length,
      repeatCustomers,
      avgLTV,
      uniqueCustomers: phoneOrderCount.size,
    };
  }, [filteredOrdersRevenue, filteredCustomers]);

  const prevCustomerStats = useMemo(() => {
    const phoneOrderCount = new Map<string, number>();

    prevFilteredOrdersRevenue.forEach((o) => {
      if (!o.phone) return;
      phoneOrderCount.set(o.phone, (phoneOrderCount.get(o.phone) || 0) + 1);
    });

    const repeatCustomers = Array.from(phoneOrderCount.values()).filter((c) => c > 1).length;

    const totalLTV = prevFilteredOrdersRevenue.reduce((sum, o) => sum + toRubInt(o.total ?? 0), 0);
    const avgLTV = phoneOrderCount.size > 0 ? totalLTV / phoneOrderCount.size : 0;

    return {
      newCustomers: prevFilteredCustomers.length,
      repeatCustomers,
      avgLTV,
      uniqueCustomers: phoneOrderCount.size,
    };
  }, [prevFilteredOrdersRevenue, prevFilteredCustomers]);

  const bonusStats = useMemo(() => {
    const added = filteredBonusHistory.filter((b) => b.amount > 0).reduce((sum, b) => sum + toRubInt(b.amount), 0);
    const subtracted = filteredBonusHistory.filter((b) => b.amount < 0).reduce((sum, b) => sum + toRubInt(-b.amount), 0);
    return { added, subtracted };
  }, [filteredBonusHistory]);

  const prevBonusStats = useMemo(() => {
    const added = prevFilteredBonusHistory.filter((b) => b.amount > 0).reduce((sum, b) => sum + toRubInt(b.amount), 0);
    const subtracted = prevFilteredBonusHistory.filter((b) => b.amount < 0).reduce((sum, b) => sum + toRubInt(-b.amount), 0);
    return { added, subtracted };
  }, [prevFilteredBonusHistory]);

  const promoStats = useMemo(() => {
    const promoUsage = new Map<string, { code: string; count: number; totalDiscount: number }>();

    // промо считаем только по выручечным (delivered)
    filteredOrdersRevenue.forEach((o) => {
      if (!o.promo_code) return;
      const promo = initialPromoCodes.find((p) => p.code === o.promo_code);
      if (!promo) return;

      const cur = promoUsage.get(o.promo_code) ?? { code: o.promo_code, count: 0, totalDiscount: 0 };
      cur.count += 1;
      cur.totalDiscount += toRubInt(promo.discount);
      promoUsage.set(o.promo_code, cur);
    });

    return Array.from(promoUsage.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredOrdersRevenue, initialPromoCodes]);

  const totalRevenue = useMemo(
    () => filteredOrdersRevenue.reduce((sum, o) => sum + toRubInt(o.total ?? 0), 0),
    [filteredOrdersRevenue]
  );
  const prevTotalRevenue = useMemo(
    () => prevFilteredOrdersRevenue.reduce((sum, o) => sum + toRubInt(o.total ?? 0), 0),
    [prevFilteredOrdersRevenue]
  );

  const avgCheck = useMemo(
    () => (filteredOrdersRevenue.length > 0 ? Math.round(totalRevenue / filteredOrdersRevenue.length) : 0),
    [filteredOrdersRevenue.length, totalRevenue]
  );
  const prevAvgCheck = useMemo(
    () => (prevFilteredOrdersRevenue.length > 0 ? Math.round(prevTotalRevenue / prevFilteredOrdersRevenue.length) : 0),
    [prevFilteredOrdersRevenue.length, prevTotalRevenue]
  );

  // "Заказы сегодня" - не выручка, а оперативка.
  // Считаем все, кроме canceled, чтобы видеть нагрузку.
  const todayOrders = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    return initialOrders.filter((o) => {
      if (!o.created_at) return false;
      if (isCanceled(o.status)) return false;
      const d = new Date(o.created_at);
      return d >= todayStart && d <= todayEnd;
    }).length;
  }, [initialOrders]);

  const deltaRevenue = useMemo(() => percentDelta(totalRevenue, prevTotalRevenue), [totalRevenue, prevTotalRevenue]);
  const deltaOrders = useMemo(
    () => percentDelta(filteredOrdersRevenue.length, prevFilteredOrdersRevenue.length),
    [filteredOrdersRevenue.length, prevFilteredOrdersRevenue.length]
  );
  const deltaAvgCheck = useMemo(() => percentDelta(avgCheck, prevAvgCheck), [avgCheck, prevAvgCheck]);
  const deltaNewCustomers = useMemo(
    () => percentDelta(customerStats.newCustomers, prevCustomerStats.newCustomers),
    [customerStats.newCustomers, prevCustomerStats.newCustomers]
  );

  const escapeCSV = (value: any) => {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToCSV = () => {
    const headers = ['Метрика', 'Значение'];

    const summaryRows = [
      ['Период', useCustomRange ? `${customStartDate} - ${customEndDate}` : `${period} дней`],
      ['Выручечные заказы (delivered)', filteredOrdersRevenue.length],
      ['Выручка за период', formatRub(totalRevenue)],
      ['Средний чек', formatRub(avgCheck)],
      ['Новые клиенты', customerStats.newCustomers],
      ['Повторные клиенты', customerStats.repeatCustomers],
      ['Уникальные клиенты', customerStats.uniqueCustomers],
      ['Средний LTV', formatRub(customerStats.avgLTV)],
      ['Начислено бонусов', formatRub(bonusStats.added)],
      ['Списано бонусов', formatRub(bonusStats.subtracted)],
      ['Сравнение с предыдущим периодом', ''],
      ['Заказы (дельта)', formatDelta(deltaOrders)],
      ['Выручка (дельта)', formatDelta(deltaRevenue)],
      ['Средний чек (дельта)', formatDelta(deltaAvgCheck)],
      ['Новые клиенты (дельта)', formatDelta(deltaNewCustomers)],
    ];

    const ordersHeader = ['Период', 'Кол-во заказов', 'Выручка'];
    const ordersRows = groupedOrders.map((g) => [g.date, g.count, toRubInt(g.revenue)]);

    const topProductsHeader = ['Название', 'Кол-во', 'Выручка'];
    const topProductsRows = topProducts.map((p) => [escapeCSV(p.title), p.quantity, toRubInt(p.total)]);

    const promoHeader = ['Промокод', 'Кол-во использований', 'Общая скидка'];
    const promoRows = promoStats.map((p) => [p.code, p.count, toRubInt(p.totalDiscount)]);

    const csv = [
      headers.join(','),
      ...summaryRows.map((row) => row.map(escapeCSV).join(',')),
      '',
      'Заказы по периодам (только delivered)',
      ordersHeader.join(','),
      ...ordersRows.map((row) => row.map(escapeCSV).join(',')),
      '',
      'Топ товаров',
      topProductsHeader.join(','),
      ...topProductsRows.map((row) => row.map(escapeCSV).join(',')),
      '',
      'Топ промокодов',
      promoHeader.join(','),
      ...promoRows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stats.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('CSV выгружен');
  };

  const periodLabel = useMemo(() => {
    if (useCustomRange) return `${customStartDate} - ${customEndDate}`;
    if (period === 7) return '7 дней';
    if (period === 30) return '30 дней';
    if (period === 90) return '90 дней';
    if (period === 365) return 'год';
    if (period === 9999) return 'всё время';
    return `${period} дней`;
  }, [useCustomRange, customStartDate, customEndDate, period]);

  const showDelta = (deltaPct: number) => {
    const isUp = deltaPct >= 0;
    return <div className={`text-xs mt-1 ${isUp ? 'text-emerald-700' : 'text-rose-700'}`}>{formatDelta(deltaPct)} к прошлому периоду</div>;
  };

  const pageBg =
    'min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(255,255,255,0.55),transparent),radial-gradient(900px_500px_at_90%_0%,rgba(255,255,255,0.35),transparent)] bg-gray-100';

  return (
    <>
      <Toaster position="top-center" />
      <div className={pageBg}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {/* Фильтры */}
          <div className={`mb-6 p-4 ${glassHeader}`}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex items-center gap-2">
                    <label htmlFor="period-select" className="text-sm text-gray-700">
                      Период:
                    </label>
                    <select
                      id="period-select"
                      value={useCustomRange ? 'custom' : period}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setUseCustomRange(true);
                        } else {
                          setUseCustomRange(false);
                          setPeriod(Number(e.target.value));
                        }
                      }}
                      className={selectBase}
                      aria-label="Выбрать период статистики"
                    >
                      <option value={7}>7 дней</option>
                      <option value={30}>30 дней</option>
                      <option value={90}>90 дней</option>
                      <option value={365}>Год</option>
                      <option value={9999}>Всё время</option>
                      <option value="custom">Свой диапазон</option>
                    </select>
                  </div>

                  {useCustomRange && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className={inputBase}
                        aria-label="Выбрать начальную дату"
                      />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className={inputBase}
                        aria-label="Выбрать конечную дату"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label htmlFor="granularity" className="text-sm text-gray-700">
                      Графики:
                    </label>
                    <select
                      id="granularity"
                      value={granularity}
                      onChange={(e) => setGranularity(e.target.value as Granularity)}
                      className={selectBase}
                      aria-label="Выбрать детализацию графиков"
                    >
                      <option value="day">По дням</option>
                      <option value="week">По неделям</option>
                      <option value="month">По месяцам</option>
                    </select>
                  </div>
                </div>

                <motion.button onClick={exportToCSV} className={btnPrimary} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  Экспортировать в CSV
                </motion.button>
              </div>

              <div className={hintText}>Сейчас: {periodLabel}. сравнение идет с предыдущим периодом такой же длины. выручка считается по delivered.</div>
            </div>
          </div>

          {/* Ключевые метрики */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <motion.div className={`p-4 ${glassShell} text-center`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
              <div className="text-gray-700 text-sm mb-1">Заказы сегодня</div>
              <div className="text-2xl font-bold text-gray-900">{todayOrders}</div>
              <div className="text-xs mt-1 text-gray-600">оперативная метрика (без canceled)</div>
            </motion.div>

            <motion.div className={`p-4 ${glassShell} text-center`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.12 }}>
              <div className="text-gray-700 text-sm mb-1">Выручка за период</div>
              <div className="text-2xl font-bold text-gray-900">{formatRub(totalRevenue)}</div>
              {showDelta(deltaRevenue)}
            </motion.div>

            <motion.div className={`p-4 ${glassShell} text-center`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.19 }}>
              <div className="text-gray-700 text-sm mb-1">Средний чек</div>
              <div className="text-2xl font-bold text-gray-900">{formatRub(avgCheck)}</div>
              {showDelta(deltaAvgCheck)}
            </motion.div>

            <motion.div
              className={`p-4 ${glassShell} text-center cursor-pointer hover:bg-white/70 transition`}
              onClick={() => router.push('/admin/customers')}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.26 }}
              aria-label="Перейти к списку клиентов"
            >
              <div className="text-gray-700 text-sm mb-1">Новые клиенты</div>
              <div className="text-2xl font-bold text-gray-900">{customerStats.newCustomers}</div>
              {showDelta(deltaNewCustomers)}
            </motion.div>
          </div>

          {/* Клиенты + активность */}
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900">Клиенты</h2>
              <motion.div className={`p-4 ${glassShell}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-700">Выручечные заказы (delivered)</div>
                    <div className="text-2xl font-bold text-gray-900">{filteredOrdersRevenue.length}</div>
                    {showDelta(deltaOrders)}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-700">Повторные клиенты</div>
                    <div className="text-2xl font-bold text-gray-900">{customerStats.repeatCustomers}</div>
                    <div className="text-xs mt-1 text-gray-600">уникальных: {customerStats.uniqueCustomers}</div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-800">
                  Средний LTV: <span className="font-semibold">{formatRub(customerStats.avgLTV)}</span>
                </div>

                <div className="mt-2 text-xs text-gray-600">
                  прошлый период: выручка {formatRub(prevTotalRevenue)}, delivered {prevFilteredOrdersRevenue.length}
                </div>
              </motion.div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900">Активность заказов (delivered)</h2>
              <div className={`p-4 ${glassShell}`}>
                {groupedOrders.length === 0 ? (
                  <p className="text-gray-700 text-center">Нет данных для отображения</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={groupedOrders} aria-label="График активности заказов">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Выручка + бонусы */}
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900">Выручка (delivered)</h2>
              <div className={`p-4 ${glassShell}`}>
                {groupedOrders.length === 0 ? (
                  <p className="text-gray-700 text-center">Нет данных для отображения</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={groupedOrders} aria-label="График выручки">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900">Бонусы</h2>
              <motion.div className={`p-4 ${glassShell}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-700 mb-1">Начислено</div>
                    <div className="text-xl font-bold text-gray-900">{formatRub(bonusStats.added)}</div>
                    <div className="text-xs mt-1 text-gray-600">было: {formatRub(prevBonusStats.added)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-700 mb-1">Списано</div>
                    <div className="text-xl font-bold text-gray-900">{formatRub(bonusStats.subtracted)}</div>
                    <div className="text-xs mt-1 text-gray-600">было: {formatRub(prevBonusStats.subtracted)}</div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-600">
                  это помогает понять, насколько бонусы реально работают как мотивация и скидка
                </div>
              </motion.div>
            </div>
          </div>

          {/* Топ товаров + промокоды */}
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-900">🏆 Топ товаров</h2>

              {!initialItems.some((i) => typeof i.order_id !== 'undefined') && (
                <div className="text-xs text-amber-800 mb-2">
                  сейчас топ товаров считается за всё время. если в order_items есть order_id - добавь его в select на сервере, и топ станет по выбранному периоду.
                </div>
              )}

              <div className={glassShell}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <caption className="sr-only">Список топ-товаров</caption>
                    <thead>
                      <tr className="text-gray-800">
                        <th scope="col" className="p-3 border-b border-white/15 bg-white/30">Название</th>
                        <th scope="col" className="p-3 border-b border-white/15 bg-white/30 text-right">Кол-во</th>
                        <th scope="col" className="p-3 border-b border-white/15 bg-white/30 text-right">Выручка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p) => (
                        <motion.tr key={p.product_id} className="border-t border-white/10 hover:bg-white/35 transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                          <td className="p-3 text-gray-900">{p.title}</td>
                          <td className="p-3 text-right text-gray-900">{p.quantity}</td>
                          <td className="p-3 text-right text-gray-900">{formatRub(p.total)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-900">💸 Топ промокодов</h2>
              <div className={glassShell}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <caption className="sr-only">Список топ-промокодов</caption>
                    <thead>
                      <tr className="text-gray-800">
                        <th scope="col" className="p-3 border-b border-white/15 bg-white/30">Промокод</th>
                        <th scope="col" className="p-3 border-b border-white/15 bg-white/30 text-right">Использований</th>
                        <th scope="col" className="p-3 border-b border-white/15 bg-white/30 text-right">Скидка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoStats.map((p) => (
                        <motion.tr key={p.code} className="border-t border-white/10 hover:bg-white/35 transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                          <td className="p-3 text-gray-900">{p.code}</td>
                          <td className="p-3 text-right text-gray-900">{p.count}</td>
                          <td className="p-3 text-right text-gray-900">{formatRub(p.totalDiscount)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-xs text-gray-600 mt-3">
                дальше можно добавить: доля заказов и доля выручки по промокодам, чтобы видеть, не убиваешь ли маржу
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
