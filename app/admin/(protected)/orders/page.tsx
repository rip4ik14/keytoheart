// файл: app/admin/orders/page.tsx

import React from 'react';
import OrdersTableClient from './OrdersTableClient';
import { supabaseAdmin } from '@/lib/supabase/server';

export default async function AdminOrdersPage() {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Управление заказами</h1>
      <OrdersTableClient initialOrders={orders || []} loadError={error} />
    </div>
  );
}
