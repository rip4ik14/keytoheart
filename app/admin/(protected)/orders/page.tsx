// app/admin/(protected)/orders/page.tsx
import React from 'react';
import OrdersTableClient from './OrdersTableClient';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth';

interface Order {
  id: string;
  created_at: string | null;
  phone: string | null;
  contact_name: string | null;
  total: number | null;
  payment_method: string | null;
  status: string | null;
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
        total: true,
        payment_method: true,
        status: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Явно типизируем параметр o как any
    orders = rows.map((o: any): Order => ({
      id: o.id,
      created_at: o.created_at ? o.created_at.toISOString() : null,
      phone: o.phone,
      contact_name: o.contact_name,
      total: o.total !== null ? Number(o.total) : null,
      payment_method: o.payment_method,
      status: o.status,
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
