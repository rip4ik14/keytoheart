// ✅ Путь: app/admin/(protected)/orders/page.tsx
import React from 'react';
import OrdersTableClient from './OrdersTableClient';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth';

interface Order {
  id: string;
  order_number: number | null;

  created_at: string | null;

  phone: string | null;
  name: string | null;
  contact_name: string | null;

  recipient: string | null;
  occasion: string | null;
  recipient_phone: string | null;

  address: string | null;
  delivery_method: string | null;
  delivery_date: string | null;
  delivery_time: string | null;

  payment_method: string | null;

  total: number | null;

  bonuses_used: number | null;
  bonus: number | null;

  anonymous: boolean | null;
  whatsapp: boolean | null;

  delivery_instructions: string | null;
  postcard_text: string | null;

  promo_discount: number | null;
  promo_code: string | null;

  status: string | null;

  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    isUpsell?: boolean;
    category?: string;

    // ✅ новые поля для админки
    product_url?: string;
    image_url?: string | null;
  }>;

  upsell_details: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    category?: string;

    // ✅ если захочешь позже - можно тоже прокинуть
    product_url?: string;
    image_url?: string | null;
  }>;
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeJsonArray(v: any): any[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toIntOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export default async function AdminOrdersPage() {
  // Проверка админ-сессии
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) redirect('/admin/login?error=no-session');
  if (!(await verifyAdminJwt(token))) redirect('/admin/login?error=invalid-session');

  let orders: Order[] = [];
  let loadError: string | null = null;

  try {
    const rows = await prisma.orders.findMany({
      select: {
        id: true,
        order_number: true,
        created_at: true,

        phone: true,
        name: true,
        contact_name: true,

        recipient: true,
        occasion: true, // ✅ ДОБАВИЛИ
        recipient_phone: true,

        address: true,
        delivery_method: true,
        delivery_date: true,
        delivery_time: true,

        payment_method: true,
        total: true,

        bonuses_used: true,
        bonus: true,

        anonymous: true,
        whatsapp: true,

        delivery_instructions: true,
        postcard_text: true,

        promo_discount: true,
        promo_code: true,

        status: true,

        items: true,
        upsell_details: true,
      },
      orderBy: { created_at: 'desc' },
      take: 500,
    });

    // ✅ Соберем все productId (только из основных товаров, которые без isUpsell)
    const allProductIds: number[] = [];
    for (const r of rows as any[]) {
      const itemsArr = safeJsonArray(r.items);
      for (const it of itemsArr) {
        if (it?.isUpsell) continue;
        const pid = toIntOrNull(it?.id);
        if (pid && pid > 0) allProductIds.push(pid);
      }
    }

    const uniqProductIds = Array.from(new Set(allProductIds));
    const productMap = new Map<number, { imageUrl: string | null }>();

    // ✅ Тянем картинки товаров из Supabase products (images[])
    if (uniqProductIds.length > 0) {
      const { data: products, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, images')
        .in('id', uniqProductIds);

      if (!productError && Array.isArray(products)) {
        for (const p of products as any[]) {
          const id = Number(p?.id);
          const images = Array.isArray(p?.images) ? p.images : [];
          const first = typeof images?.[0] === 'string' ? images[0] : null;
          if (Number.isFinite(id)) productMap.set(id, { imageUrl: first });
        }
      }
    }

    orders = (rows as any[]).map((o: any): Order => {
      const itemsArr = safeJsonArray(o.items).map((it: any) => {
        const rawId = String(it.id ?? '');
        const pid = toIntOrNull(it.id);
        const imageUrl = pid ? productMap.get(pid)?.imageUrl ?? null : null;

        return {
          id: rawId,
          title: String(it.title ?? it.name ?? 'Товар'),
          price: toNumber(it.price) ?? 0,
          quantity: Number(it.quantity ?? 1) || 1,
          isUpsell: Boolean(it.isUpsell),
          category: it.category ? String(it.category) : undefined,

          // ✅ ссылка на страницу товара (для основного товара)
          product_url: pid ? `/product/${pid}` : undefined,
          image_url: imageUrl,
        };
      });

      const upsellArr = safeJsonArray(o.upsell_details).map((it: any) => ({
        id: String(it.id ?? ''),
        title: String(it.title ?? it.name ?? 'Дополнение'),
        price: toNumber(it.price) ?? 0,
        quantity: Number(it.quantity ?? 1) || 1,
        category: it.category ? String(it.category) : undefined,

        // upsell обычно не является товаром с /product/[id]
        product_url: undefined,
        image_url: null,
      }));

      return {
        id: o.id,
        order_number: typeof o.order_number === 'number' ? o.order_number : null,
        created_at: o.created_at ? o.created_at.toISOString() : null,

        phone: o.phone ?? null,
        name: o.name ?? null,
        contact_name: o.contact_name ?? null,

        recipient: o.recipient ?? null,
        occasion: o.occasion ?? null, // ✅ ДОБАВИЛИ
        recipient_phone: o.recipient_phone ?? null,

        address: o.address ?? null,
        delivery_method: o.delivery_method ?? null,
        delivery_date: o.delivery_date ?? null,
        delivery_time: o.delivery_time ?? null,

        payment_method: o.payment_method ?? null,

        total: toNumber(o.total),

        bonuses_used: toNumber(o.bonuses_used),
        bonus: toNumber(o.bonus),

        anonymous: o.anonymous ?? null,
        whatsapp: o.whatsapp ?? null,

        delivery_instructions: o.delivery_instructions ?? null,
        postcard_text: o.postcard_text ?? null,

        promo_discount: toNumber(o.promo_discount),
        promo_code: o.promo_code ?? null,

        status: o.status ?? 'pending',

        items: itemsArr,
        upsell_details: upsellArr,
      };
    });
  } catch (err: any) {
    process.env.NODE_ENV !== 'production' && console.error('Error fetching orders:', err);
    loadError = err?.message || 'Ошибка загрузки заказов';
  }

  // Не оборачивай тут в <main>, пусть layout решает отступы
  return <OrdersTableClient initialOrders={orders} loadError={loadError} />;
}
