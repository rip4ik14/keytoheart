import React from 'react';
import OrdersTableClient from './OrdersTableClient';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminOrdersPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Проверяем наличие сессии
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error('Session check failed:', sessionError);
    redirect('/admin/login?error=no-session');
  }

  // Проверяем наличие пользователя
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || !user.id) {
    console.error('User check failed:', userError);
    redirect('/admin/login?error=no-user');
  }

  console.log('Accessing orders for user:', { id: user.id, phone: user.phone }); // Отладка

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