'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Order = {
  id: string;
  total: number;
  created_at: string;
  phone: string;
  promo_code: string | null; // Изменяем undefined на null
};

type OrderItem = {
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

export default function StatsClient({
  initialOrders,
  initialItems,
  initialCustomers,
  initialBonusHistory,
  initialPromoCodes,
}: Props) {
  const [period, setPeriod] = useState<number>(30);
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [useCustomRange, setUseCustomRange] = useState(false);
  const router = useRouter();

  // Сохранение выбранного периода в localStorage
  useEffect(() => {
    const savedPeriod = localStorage.getItem('statsPeriod');
    if (savedPeriod) {
      setPeriod(Number(savedPeriod));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('statsPeriod', String(period));
  }, [period]);

  // Фильтрация заказов по периоду
  const filteredOrders = useMemo(() => {
    let startDate: Date;
    let endDate: Date = new Date();

    if (useCustomRange) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      startDate = period === 9999 ? new Date(0) : subDays(new Date(), period);
    }

    return initialOrders.filter(
      (o) =>
        o.created_at &&
        new Date(o.created_at) >= startDate &&
        new Date(o.created_at) <= endDate
    );
  }, [initialOrders, period, useCustomRange, customStartDate, customEndDate]);

  // Фильтрация клиентов по периоду
  const filteredCustomers = useMemo(() => {
    let startDate: Date;
    let endDate: Date = new Date();

    if (useCustomRange) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      startDate = period === 9999 ? new Date(0) : subDays(new Date(), period);
    }

    return initialCustomers.filter(
      (c) =>
        new Date(c.created_at) >= startDate &&
        new Date(c.created_at) <= endDate
    );
  }, [initialCustomers, period, useCustomRange, customStartDate, customEndDate]);

  // Фильтрация бонусов по периоду
  const filteredBonusHistory = useMemo(() => {
    let startDate: Date;
    let endDate: Date = new Date();

    if (useCustomRange) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      startDate = period === 9999 ? new Date(0) : subDays(new Date(), period);
    }

    return initialBonusHistory.filter(
      (b) =>
        new Date(b.created_at) >= startDate &&
        new Date(b.created_at) <= endDate
    );
  }, [initialBonusHistory, period, useCustomRange, customStartDate, customEndDate]);

  // Группировка заказов по дате
  const groupedOrders = useMemo(() => {
    const map = new Map<string, { date: string; count: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      if (!o.created_at) return;
      const d = format(new Date(o.created_at), 'dd.MM.yy', { locale: ru });
      const cur = map.get(d) ?? { date: d, count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += o.total ?? 0;
      map.set(d, cur);
    });
    const result = Array.from(map.values());
    process.env.NODE_ENV !== "production" && console.log('Grouped Orders:', result); // Отладка
    return result;
  }, [filteredOrders]);

  // Топ-товары
  const topProducts = useMemo(() => {
    const m = new Map<number, { product_id: number; quantity: number; total: number; title: string }>();
    initialItems.forEach((i) => {
      const entry = m.get(i.product_id) ?? { product_id: i.product_id, quantity: 0, total: 0, title: i.title };
      entry.quantity += i.quantity;
      entry.total += i.quantity * i.price;
      m.set(i.product_id, entry);
    });
    return Array.from(m.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [initialItems]);

  // Анализ клиентов
  const customerStats = useMemo(() => {
    const phoneOrderCount = new Map<string, number>();
    filteredOrders.forEach((o) => {
      if (o.phone) {
        phoneOrderCount.set(o.phone, (phoneOrderCount.get(o.phone) || 0) + 1);
      }
    });

    const repeatCustomers = Array.from(phoneOrderCount.entries()).filter(
      ([_, count]) => count > 1
    ).length;

    const totalLTV = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgLTV = phoneOrderCount.size > 0 ? totalLTV / phoneOrderCount.size : 0;

    return {
      newCustomers: filteredCustomers.length,
      repeatCustomers,
      avgLTV,
    };
  }, [filteredOrders, filteredCustomers]);

  // Анализ бонусов
  const bonusStats = useMemo(() => {
    const added = filteredBonusHistory
      .filter((b) => b.amount > 0)
      .reduce((sum, b) => sum + b.amount, 0);
    const subtracted = filteredBonusHistory
      .filter((b) => b.amount < 0)
      .reduce((sum, b) => sum + -b.amount, 0);

    return { added, subtracted };
  }, [filteredBonusHistory]);

  // Анализ промокодов
  const promoStats = useMemo(() => {
    const promoUsage = new Map<string, { code: string; count: number; totalDiscount: number }>();
    filteredOrders.forEach((o) => {
      if (o.promo_code) {
        const promo = initialPromoCodes.find((p) => p.code === o.promo_code);
        if (promo) {
          const cur = promoUsage.get(o.promo_code) ?? { code: o.promo_code, count: 0, totalDiscount: 0 };
          cur.count += 1;
          // Поскольку discount_type отсутствует, предполагаем фиксированную скидку
          cur.totalDiscount += promo.discount;
          promoUsage.set(o.promo_code, cur);
        }
      }
    });
    return Array.from(promoUsage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredOrders, initialPromoCodes]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const avgCheck = filteredOrders.length > 0 ? Math.round(totalRevenue / filteredOrders.length) : 0;

  // Ключевые метрики для быстрого обзора
  const todayOrders = filteredOrders.filter(
    (o) => new Date(o.created_at) >= new Date(new Date().setHours(0, 0, 0, 0))
  ).length;
  const weekRevenue = filteredOrders
    .filter((o) => new Date(o.created_at) >= subDays(new Date(), 7))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Экранирование для CSV
  const escapeCSV = (value: any) => {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Экспорт данных в CSV
  const exportToCSV = () => {
    const headers = ["Метрика", "Значение"];
    const summaryRows = [
      ["Всего заказов", filteredOrders.length],
      ["Общая выручка", totalRevenue.toLocaleString() + " ₽"],
      ["Средний чек", avgCheck.toLocaleString() + " ₽"],
      ["Новые клиенты", customerStats.newCustomers],
      ["Повторные клиенты", customerStats.repeatCustomers],
      ["Средний LTV", customerStats.avgLTV.toLocaleString() + " ₽"],
      ["Начислено бонусов", bonusStats.added.toLocaleString() + " ₽"],
      ["Списано бонусов", bonusStats.subtracted.toLocaleString() + " ₽"],
    ];

    const ordersHeader = ["Дата", "Кол-во заказов", "Выручка"];
    const ordersRows = groupedOrders.map((g) => [g.date, g.count, g.revenue]);

    const topProductsHeader = ["Название", "Кол-во", "Выручка"];
    const topProductsRows = topProducts.map((p) => [escapeCSV(p.title), p.quantity, p.total]);

    const promoHeader = ["Промокод", "Кол-во использований", "Общая скидка"];
    const promoRows = promoStats.map((p) => [p.code, p.count, p.totalDiscount]);

    const csv = [
      headers.join(","),
      ...summaryRows.map((row) => row.map(escapeCSV).join(",")),
      "",
      "Заказы по датам",
      ordersHeader.join(","),
      ...ordersRows.map((row) => row.map(escapeCSV).join(",")),
      "",
      "Топ товаров",
      topProductsHeader.join(","),
      ...topProductsRows.map((row) => row.map(escapeCSV).join(",")),
      "",
      "Топ промокодов",
      promoHeader.join(","),
      ...promoRows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stats.csv";
    a.click();
  };

  return (
    <>
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Фильтры */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="period-select" className="text-sm text-gray-600">
              Период:
            </label>
            <select
              id="period-select"
              value={useCustomRange ? "custom" : period}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setUseCustomRange(true);
                } else {
                  setUseCustomRange(false);
                  setPeriod(Number(e.target.value));
                }
              }}
              className="border p-2 rounded text-sm"
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
                className="border p-2 rounded text-sm"
                aria-label="Выбрать начальную дату"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border p-2 rounded text-sm"
                aria-label="Выбрать конечную дату"
              />
            </div>
          )}
          <motion.button
            onClick={exportToCSV}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Экспортировать статистику в CSV"
          >
            Экспортировать в CSV
          </motion.button>
        </div>

        {/* Ключевые метрики */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <motion.div
            className="p-4 bg-white rounded-xl shadow text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="text-gray-500 text-sm mb-1">Заказы сегодня</div>
            <div className="text-2xl font-bold">{todayOrders}</div>
          </motion.div>
          <motion.div
            className="p-4 bg-white rounded-xl shadow text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="text-gray-500 text-sm mb-1">Выручка за неделю</div>
            <div className="text-2xl font-bold">{weekRevenue.toLocaleString()} ₽</div>
          </motion.div>
          <motion.div
            className="p-4 bg-white rounded-xl shadow text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="text-gray-500 text-sm mb-1">Средний чек</div>
            <div className="text-2xl font-bold">{avgCheck.toLocaleString()} ₽</div>
          </motion.div>
          <motion.div
            className="p-4 bg-white rounded-xl shadow text-center cursor-pointer hover:bg-gray-50"
            onClick={() => router.push('/admin/customers')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            aria-label="Перейти к списку новых клиентов"
          >
            <div className="text-gray-500 text-sm mb-1">Новые клиенты</div>
            <div className="text-2xl font-bold">{customerStats.newCustomers}</div>
          </motion.div>
        </div>

        {/* Статистика клиентов */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="text-lg font-semibold mb-2">Повторные клиенты</h2>
            <motion.div
              className="p-4 bg-white rounded-xl shadow text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-2xl font-bold">{customerStats.repeatCustomers}</div>
              <div className="text-gray-500 text-sm mt-1">
                Средний LTV: {customerStats.avgLTV.toLocaleString()} ₽
              </div>
            </motion.div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Активность заказов</h2>
            {groupedOrders.length === 0 ? (
              <p className="text-gray-500 text-center">Нет данных для отображения</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groupedOrders} aria-label="График активности заказов">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Выручка и бонусы */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="text-lg font-semibold mb-2">Выручка</h2>
            {groupedOrders.length === 0 ? (
              <p className="text-gray-500 text-center">Нет данных для отображения</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={groupedOrders} aria-label="График выручки">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Бонусы</h2>
            <motion.div
              className="p-4 bg-white rounded-xl shadow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-sm text-gray-500 mb-2">
                Начислено: {bonusStats.added.toLocaleString()} ₽
              </div>
              <div className="text-sm text-gray-500">
                Списано: {bonusStats.subtracted.toLocaleString()} ₽
              </div>
            </motion.div>
          </div>
        </div>

        {/* Топ товаров и промокоды */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="text-xl font-bold mb-4">🏆 Топ товаров</h2>
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <caption className="sr-only">Список топ-товаров</caption>
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="p-2">Название</th>
                    <th scope="col" className="p-2 text-right">Кол-во</th>
                    <th scope="col" className="p-2 text-right">Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <motion.tr
                      key={p.product_id}
                      className="border-t hover:bg-gray-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="p-2">{p.title}</td>
                      <td className="p-2 text-right">{p.quantity}</td>
                      <td className="p-2 text-right">{p.total.toLocaleString()} ₽</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">💸 Топ промокодов</h2>
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <caption className="sr-only">Список топ-промокодов</caption>
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="p-2">Промокод</th>
                    <th scope="col" className="p-2 text-right">Использований</th>
                    <th scope="col" className="p-2 text-right">Скидка</th>
                  </tr>
                </thead>
                <tbody>
                  {promoStats.map((p) => (
                    <motion.tr
                      key={p.code}
                      className="border-t hover:bg-gray-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="p-2">{p.code}</td>
                      <td className="p-2 text-right">{p.count}</td>
                      <td className="p-2 text-right">{p.totalDiscount.toLocaleString()} ₽</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}