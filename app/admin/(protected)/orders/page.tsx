// ✅ Путь: app/admin/(protected)/orders/page.tsx
import React from 'react';
import OrdersTableClient from './OrdersTableClient';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth';

// Интерфейс заказа (можно вынести в types.ts)
interface Order {
  id: string;
  created_at: string | null;
  phone: string | null;
  contact_name: string | null;
  recipient: string | null;
  recipient_phone: string | null;
  address: string | null;
  total: number | null;
  payment_method: string | null;
  status: string | null;
  delivery_method: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  anonymous: boolean | null;
  whatsapp: boolean | null;
  postcard_text: string | null;
  promo_id: string | null;
  promo_discount: number | null;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  upsell_details: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
}

export default async function AdminOrdersPage() {
  // Очищаем cookies Supabase через API
  try {
    const res = await fetch('http://localhost:3000/api/clear-supabase-cookies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      process.env.NODE_ENV !== "production" && console.error('Failed to clear Supabase cookies:', result.error);
    }
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error calling clear-supabase-cookies API:', error);
  }

  // Проверка сессии
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) {
    redirect('/admin/login?error=no-session');
  }
  if (!(await verifyAdminJwt(token))) {
    redirect('/admin/login?error=invalid-session');
  }

  // Забираем заказы из Prisma
  let orders: Order[] = [];
  let loadError: string | null = null;
  try {
    const rows = await prisma.orders.findMany({
      select: {
        id: true,
        created_at: true,
        phone: true,
        contact_name: true,
        recipient: true,
        recipient_phone: true,
        address: true,
        total: true,
        payment_method: true,
        status: true,
        delivery_method: true,
        delivery_date: true,
        delivery_time: true,
        anonymous: true,
        whatsapp: true,
        postcard_text: true,
        promo_id: true,
        promo_discount: true,
        items: true,
        upsell_details: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Приведение к нужному виду: items и upsell_details всегда массив
    orders = rows.map((o: any): Order => ({
      id: o.id,
      created_at: o.created_at ? o.created_at.toISOString() : null,
      phone: o.phone ?? null,
      contact_name: o.contact_name ?? null,
      recipient: o.recipient ?? null,
      recipient_phone: o.recipient_phone ?? null,
      address: o.address ?? null,
      total: o.total !== null && o.total !== undefined ? Number(o.total) : null,
      payment_method: o.payment_method ?? null,
      status: o.status ?? null,
      delivery_method: o.delivery_method ?? null,
      delivery_date: o.delivery_date ?? null,
      delivery_time: o.delivery_time ?? null,
      anonymous: o.anonymous ?? null,
      whatsapp: o.whatsapp ?? null,
      postcard_text: o.postcard_text ?? null,
      promo_id: o.promo_id ?? null,
      promo_discount: o.promo_discount !== null && o.promo_discount !== undefined ? Number(o.promo_discount) : null,
      items:
        Array.isArray(o.items)
          ? o.items
          : o.items
            ? typeof o.items === 'string'
              ? JSON.parse(o.items)
              : o.items
            : [],
      upsell_details:
        Array.isArray(o.upsell_details)
          ? o.upsell_details
          : o.upsell_details
            ? typeof o.upsell_details === 'string'
              ? JSON.parse(o.upsell_details)
              : o.upsell_details
            : [],
    }));
  } catch (err: any) {
    process.env.NODE_ENV !== "production" && console.error('Error fetching orders:', err);
    loadError = err?.message || 'Ошибка загрузки заказов';
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight">
          Управление заказами
        </h1>
        <OrdersTableClient initialOrders={orders} loadError={loadError} />
      </section>
    </main>
  );
}