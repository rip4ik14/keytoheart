import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { PrismaClient } from '@prisma/client';
import StatsClient from './StatsClient';

export const dynamic = 'force-dynamic';

export default async function AdminStatsPage() {
  const prisma = new PrismaClient();

  try {
    // 1) Все заказы (через Prisma)
    const orders = await prisma.orders.findMany({
      select: {
        id: true,
        total: true,
        created_at: true,
        phone: true,
        promo_id: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // 2) Все позиции заказов (через Supabase)
    const sb = supabaseAdmin as any;
    const { data: items, error: itemsError } = await sb
      .from('order_items')
      .select('product_id, quantity, price')
      .not('product_id', 'is', null);
    if (itemsError) {
      throw new Error('Не удалось загрузить позиции заказов: ' + itemsError.message);
    }

    // 3) Уникальные product_id
    const productIds = Array.from(
      new Set(
        items
          .map((i: any) => i.product_id)
          .filter((id: number | null): id is number => id !== null),
      ),
    );

    // 4) Тянем названия продуктов (через Supabase)
    const { data: products, error: productsError } = await sb
      .from('products')
      .select('id, title')
      .in('id', productIds);
    if (productsError) {
      throw new Error('Не удалось загрузить продукты: ' + productsError.message);
    }

    // 5) Мапим позиции, добавляя title
    const itemsWithTitle = (items as any[]).map((i) => {
      const prod = (products as any[]).find((p) => p.id === i.product_id);
      return {
        product_id: i.product_id!,
        quantity: i.quantity,
        price: i.price,
        title: prod?.title ?? 'Без названия',
      };
    });

    // 6) Данные о клиентах из auth.admin.listUsers() (через Supabase)
    const { data: usersList, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) {
      throw new Error('Не удалось загрузить пользователей: ' + usersError.message);
    }
    const customers = (usersList.users as any[]).map((u) => ({
      id: u.id,
      phone: u.user_metadata?.phone || u.phone || '—',
      created_at: u.created_at,
    }));

    // 7) История бонусов (через Prisma)
    const bonusHistory = await prisma.bonus_history.findMany({
      select: {
        amount: true,
        reason: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
    const normalizedBonusHistory = (bonusHistory as any[]).map((b) => ({
      amount: b.amount ? Number(b.amount) : 0, // Преобразуем Decimal в number
      reason: b.reason ?? '',
      created_at: b.created_at ?? '',
    }));

    // 8) Промокоды (через Supabase)
    const { data: promoCodes, error: promoError } = await sb
      .from('promo_codes')
      .select('id, code, discount, created_at')
      .order('created_at', { ascending: true });
    if (promoError) {
      throw new Error('Не удалось загрузить промокоды: ' + promoError.message);
    }
    const promoCodeMap = new Map((promoCodes as any[]).map((p) => [p.id, p.code]));
    const normalizedPromoCodes = (promoCodes as any[]).map((p) => ({
      code: p.code,
      discount: p.discount,
      created_at: p.created_at ?? '',
    }));

    // 9) Собираем финальный массив заказов с promo_code
    const normalizedOrders = (orders as any[]).map((o) => ({
      id: o.id,
      total: Number(o.total) ?? 0,
      created_at: o.created_at ?? '',
      phone: o.phone ?? '—',
      promo_code: o.promo_id ? promoCodeMap.get(o.promo_id) ?? null : null,
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
  } catch (error) {
    process.env.NODE_ENV !== 'production' &&
      console.error('[admin/stats] load error →', error);

    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">📊 Статистика недоступна</h1>
        <p className="text-gray-700">
          Не удалось загрузить административные данные. Проверьте подключение к БД и Supabase и
          повторите попытку.
        </p>
      </div>
    );
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}