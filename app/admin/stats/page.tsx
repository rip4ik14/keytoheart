// файл: app/admin/stats/page.tsx
import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import StatsClient from './StatsClient';

export const revalidate = 60; // обновлять раз в минуту

export default async function AdminStatsPage() {
  // 1) Все заказы
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, total, created_at')
    .order('created_at', { ascending: true });

  if (ordersError) {
    throw new Error('Не удалось загрузить заказы: ' + ordersError.message);
  }

  // 2) Все позиции заказов (без join)
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity, price')
    .not('product_id', 'is', null);

  if (itemsError) {
    throw new Error('Не удалось загрузить позиции заказов: ' + itemsError.message);
  }

  // 3) Собираем все уникальные product_id
  const productIds = Array.from(new Set(items.map((i) => i.product_id)));

  // 4) Тянем названия продуктов
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, title')
    .in('id', productIds);

  if (productsError) {
    throw new Error('Не удалось загрузить продукты: ' + productsError.message);
  }

  // 5) Мапим позиции, добавляя title из products
  const itemsWithTitle = items.map((i) => {
    const prod = products.find((p) => p.id === i.product_id);
    return {
      product_id: i.product_id,
      quantity: i.quantity,
      price: i.price,
      title: prod?.title ?? 'Без названия',
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">📊 Статистика заказов</h1>
      <StatsClient
        initialOrders={orders}
        initialItems={itemsWithTitle}
      />
    </div>
  );
}
