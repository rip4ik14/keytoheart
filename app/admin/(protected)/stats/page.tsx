import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import StatsClient from './StatsClient';

export const revalidate = 60; // обновлять раз в минуту

export default async function AdminStatsPage() {
  // 1) Все заказы
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, total, created_at, phone, promo_id') // Запрашиваем promo_id вместо JOIN
    .order('created_at', { ascending: true });

  if (ordersError) {
    throw new Error('Не удалось загрузить заказы: ' + ordersError.message);
  }

  // 2) Все позиции заказов
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity, price')
    .not('product_id', 'is', null);

  if (itemsError) {
    throw new Error('Не удалось загрузить позиции заказов: ' + itemsError.message);
  }

  // 3) Уникальные product_id
  const productIds = Array.from(new Set(items.map((i) => i.product_id).filter((id): id is number => id !== null)));

  // 4) Тянем названия продуктов
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, title')
    .in('id', productIds);

  if (productsError) {
    throw new Error('Не удалось загрузить продукты: ' + productsError.message);
  }

  // 5) Мапим позиции, добавляя title
  const itemsWithTitle = items.map((i) => {
    const prod = products.find((p) => p.id === i.product_id);
    return {
      product_id: i.product_id!, // Используем !, так как мы отфильтровали null
      quantity: i.quantity,
      price: i.price,
      title: prod?.title ?? 'Без названия',
    };
  });

  // 6) Получаем данные о клиентах
  const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) {
    throw new Error('Не удалось загрузить пользователей: ' + usersError.message);
  }

  const customers = users.users.map((user) => ({
    id: user.id,
    phone: user.user_metadata?.phone || user.phone || '—',
    created_at: user.created_at,
  }));

  // 7) Получаем данные о бонусах
  const { data: bonusHistory, error: bonusError } = await supabaseAdmin
    .from('bonus_history')
    .select('amount, reason, created_at')
    .order('created_at', { ascending: true });

  if (bonusError) {
    throw new Error('Не удалось загрузить историю бонусов: ' + bonusError.message);
  }

  const normalizedBonusHistory = bonusHistory.map((item) => ({
    amount: item.amount ?? 0,
    reason: item.reason ?? '',
    created_at: item.created_at ?? '',
  }));

  // 8) Получаем данные о промокодах
  const { data: promoCodes, error: promoError } = await supabaseAdmin
    .from('promo_codes')
    .select('id, code, discount, created_at')
    .order('created_at', { ascending: true });

  if (promoError) {
    throw new Error('Не удалось загрузить промокоды: ' + promoError.message);
  }

  const promoCodeMap = new Map(promoCodes.map((promo) => [promo.id, promo.code]));

  const normalizedOrders = orders.map((order) => ({
    id: order.id,
    total: Number(order.total) ?? 0,
    created_at: order.created_at ?? '',
    phone: order.phone ?? '—',
    promo_code: order.promo_id ? promoCodeMap.get(order.promo_id) ?? null : null,
  }));

  const normalizedPromoCodes = promoCodes.map((promo) => ({
    code: promo.code,
    discount: promo.discount,
    created_at: promo.created_at ?? '',
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">📊 Статистика</h1>
      <StatsClient
        initialOrders={normalizedOrders}
        initialItems={itemsWithTitle}
        initialCustomers={customers}
        initialBonusHistory={normalizedBonusHistory}
        initialPromoCodes={normalizedPromoCodes}
      />
    </div>
  );
}