import React from 'react';
import OrdersTableClient from './OrdersTableClient';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth';

// Расширенный интерфейс Order
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
  // Геттер cookies возвращает Promise
  const cookieStore = await cookies();

  // Удаляем все sb-куки Supabase, если есть
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith('sb-')) {
      cookieStore.delete(c.name);
    }
  }

  // Проверка сессии
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

    // Явно типизируем параметр o как any
    orders = rows.map((o: any): Order => ({
      id: o.id,
      created_at: o.created_at ? o.created_at.toISOString() : null,
      phone: o.phone,
      contact_name: o.contact_name,
      recipient: o.recipient,
      recipient_phone: o.recipient_phone,
      address: o.address,
      total: o.total !== null ? Number(o.total) : null,
      payment_method: o.payment_method,
      status: o.status,
      delivery_method: o.delivery_method,
      delivery_date: o.delivery_date,
      delivery_time: o.delivery_time,
      anonymous: o.anonymous,
      whatsapp: o.whatsapp,
      postcard_text: o.postcard_text,
      promo_id: o.promo_id,
      promo_discount: o.promo_discount !== null ? Number(o.promo_discount) : null,
      items: o.items,
      upsell_details: o.upsell_details,
    }));
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    loadError = err.message || 'Ошибка загрузки заказов';
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Управление заказами</h1>
      <OrdersTableClient initialOrders={orders} loadError={loadError} />
    </div>
  );
}