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
  contact_method: string | null;
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
    product_url?: string;
    image_url?: string | null;
  }>;
  upsell_details: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    category?: string;
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

function money(n: number | null | undefined) {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return v.toLocaleString('ru-RU');
}

export default async function AdminOrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) redirect('/admin/login?error=no-session');
  if (!(await verifyAdminJwt(token))) redirect('/admin/login?error=invalid-session');

  let orders: Order[] = [];
  let loadError: string | null = null;

  let summary = {
    totalOrders: 0,
    totalRevenue: 0,
    deliveredRevenue: 0,
    avgCheck: 0,
    deliveredCount: 0,
    canceledCount: 0,
    repeatCount: 0,
    attributedCount: 0,
    yandexDirectCount: 0,
    exportNeededCount: 0,
  };

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
        occasion: true,
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
        contact_method: true,
        delivery_instructions: true,
        postcard_text: true,
        promo_discount: true,
        promo_code: true,
        status: true,
        items: true,
        upsell_details: true,
        attribution_source: true,
        is_repeat_order: true,
        metrika_client_id: true,
        yclid: true,
        utm_source: true,
        metrika_export_needed: true,
      } as any,
      orderBy: { created_at: 'desc' },
      take: 500,
    });

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

    summary = (rows as any[]).reduce(
      (acc, row) => {
        const total = toNumber(row.total) ?? 0;
        acc.totalOrders += 1;
        acc.totalRevenue += total;
        if (row.status === 'delivered') {
          acc.deliveredCount += 1;
          acc.deliveredRevenue += total;
        }
        if (row.status === 'canceled') acc.canceledCount += 1;
        if (row.is_repeat_order) acc.repeatCount += 1;
        if (row.metrika_client_id || row.yclid || row.utm_source) acc.attributedCount += 1;
        if (row.attribution_source === 'yandex_direct') acc.yandexDirectCount += 1;
        if (row.metrika_export_needed) acc.exportNeededCount += 1;
        return acc;
      },
      {
        totalOrders: 0,
        totalRevenue: 0,
        deliveredRevenue: 0,
        avgCheck: 0,
        deliveredCount: 0,
        canceledCount: 0,
        repeatCount: 0,
        attributedCount: 0,
        yandexDirectCount: 0,
        exportNeededCount: 0,
      },
    );

    summary.avgCheck = summary.totalOrders > 0 ? Math.round(summary.totalRevenue / summary.totalOrders) : 0;

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
        occasion: o.occasion ?? null,
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
        contact_method: o.contact_method ?? null,
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

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-5">
      <div className="rounded-3xl border border-white/20 bg-white/55 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🧾 Заказы</h1>
            <p className="mt-1 text-sm text-gray-700">
              здесь видно не только заказы, но и насколько они пригодны для дальнейшей связки с Яндекс Метрикой
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/metrika-orders-export"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/60 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm backdrop-blur-xl hover:bg-white/75 transition"
            >
              Скачать CSV для Метрики
            </a>
            <a
              href="/api/admin/metrika-orders-export?all=1"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/60 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm backdrop-blur-xl hover:bg-white/75 transition"
            >
              Скачать все заказы
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 xl:grid-cols-10">
        {[
          { label: 'Всего заказов', value: String(summary.totalOrders) },
          { label: 'Общая выручка', value: `${money(summary.totalRevenue)} ₽` },
          { label: 'Средний чек', value: `${money(summary.avgCheck)} ₽` },
          { label: 'Доставлено', value: String(summary.deliveredCount) },
          { label: 'Отменено', value: String(summary.canceledCount) },
          { label: 'Повторные', value: String(summary.repeatCount) },
          { label: 'С атрибуцией', value: String(summary.attributedCount) },
          { label: 'Из Яндекс Директа', value: String(summary.yandexDirectCount) },
          { label: 'Выручка доставленных', value: `${money(summary.deliveredRevenue)} ₽` },
          { label: 'Готовы к выгрузке', value: String(summary.exportNeededCount) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-white/20 bg-white/55 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl"
          >
            <div className="text-[11px] uppercase tracking-[0.08em] text-gray-500">{item.label}</div>
            <div className="mt-2 text-lg font-bold text-gray-900">{item.value}</div>
          </div>
        ))}
      </div>

      <OrdersTableClient initialOrders={orders} loadError={loadError} />
    </div>
  );
}
