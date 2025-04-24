// файл: app/admin/stats/StatsClient.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import type { Database } from '@/lib/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
interface ItemWithTitle extends OrderItem {
  title: string;
}

interface Props {
  initialOrders: Order[];
  initialItems: ItemWithTitle[];
}

export default function StatsClient({ initialOrders, initialItems }: Props) {
  const [period, setPeriod] = useState<number>(30);

  // Фильтрация заказов по периоду
  const filteredOrders = useMemo(() => {
    if (period === 9999) return initialOrders;
    const since = new Date();
    since.setDate(since.getDate() - period);
    return initialOrders.filter(
      (o) => o.created_at !== null && new Date(o.created_at) >= since
    );
  }, [initialOrders, period]);

  // Группировка по дате
  const grouped = useMemo(() => {
    const map = new Map<string, { date: string; count: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      if (!o.created_at) return;
      const d = format(new Date(o.created_at), 'dd.MM.yy', { locale: ru });
      const cur = map.get(d) ?? { date: d, count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += o.total ?? 0;
      map.set(d, cur);
    });
    return Array.from(map.values());
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

  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (o.total ?? 0), 0),
    [filteredOrders]
  );
  const avgCheck = filteredOrders.length > 0
    ? Math.round(totalRevenue / filteredOrders.length)
    : 0;

  return (
    <>
      <div className="mb-6">
        <label className="text-sm text-gray-600 mr-2">Показать за:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          className="border p-2 rounded text-sm"
        >
          <option value={7}>7 дней</option>
          <option value={30}>30 дней</option>
          <option value={90}>90 дней</option>
          <option value={365}>Год</option>
          <option value={9999}>Все время</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <div className="text-gray-500 text-sm mb-1">Всего заказов</div>
          <div className="text-2xl font-bold">{filteredOrders.length}</div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <div className="text-gray-500 text-sm mb-1">Общая выручка</div>
          <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} ₽</div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <div className="text-gray-500 text-sm mb-1">Средний чек</div>
          <div className="text-2xl font-bold">{avgCheck.toLocaleString()} ₽</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="text-lg font-semibold mb-2">Кол-во заказов</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={grouped}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Выручка</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={grouped}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">🏆 Топ товаров</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Название</th>
                <th className="p-2 text-right">Кол-во</th>
                <th className="p-2 text-right">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.product_id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{p.title}</td>
                  <td className="p-2 text-right">{p.quantity}</td>
                  <td className="p-2 text-right">{p.total.toLocaleString()} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
