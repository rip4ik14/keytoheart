import React from 'react';
import OrdersTableClient from './OrdersTableClient';
import { supabaseAdmin } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth';

export default async function AdminOrdersPage() {
  const cookieStore = await cookies();
  
  // Очистка некорректных cookies
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.includes('sb-')) {
      console.error('Clearing Supabase cookie:', cookie.name);
      cookieStore.delete(cookie.name);
    }
  }

  // Проверяем admin_session токен
  const token = cookieStore.get('admin_session')?.value;
  console.log('Admin session token:', token); // Отладка
  if (!token) {
    console.error('No admin session token found');
    redirect('/admin/login?error=no-session');
  }

  const isValidToken = await verifyAdminJwt(token);
  console.log('Token verification result:', isValidToken); // Отладка
  if (!isValidToken) {
    console.error('Invalid admin session token');
    redirect('/admin/login?error=invalid-session');
  }

  // Получаем заказы
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Управление заказами</h1>
      <OrdersTableClient initialOrders={orders || []} loadError={error} />
    </div>
  );
}