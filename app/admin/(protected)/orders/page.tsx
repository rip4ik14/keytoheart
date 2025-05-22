// ✅ Путь: app/admin/orders/page.tsx

import React from 'react';
import OrdersTableClient from './OrdersTableClient';
import { supabaseAdmin } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth';
import type { Database } from '@/lib/supabase/types_new';
import type { PostgrestError } from '@supabase/supabase-js';

type Order = Database['public']['Tables']['orders']['Row'];

export default async function AdminOrdersPage() {
  try {
    const cookieStore = await cookies();
    
    // Проверяем admin_session токен
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) {
      console.error('No admin session token found');
      redirect('/admin/login?error=no-session');
    }

    // Проверяем валидность токена
    let isValidToken = false;
    try {
      isValidToken = await verifyAdminJwt(token);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      redirect('/admin/login?error=invalid-session');
    }
    
    if (!isValidToken) {
      console.error('Invalid admin session token');
      redirect('/admin/login?error=invalid-session');
    }

    // Получаем заказы с обработкой ошибок
    let orders: Order[] = [];
    let loadError: PostgrestError | null = null;
    
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        loadError = error;
      } else {
        orders = data || [];
      }
    } catch (fetchError) {
      console.error('Unexpected error fetching orders:', fetchError);
      loadError = {
        message: 'Произошла неожиданная ошибка при загрузке заказов',
        code: 'FETCH_ERROR',
        details: '',
        hint: ''
      } as PostgrestError;
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Управление заказами
            </h1>
            <p className="mt-2 text-gray-600">
              Просматривайте и обновляйте статусы заказов
            </p>
          </div>
          
          <OrdersTableClient 
            initialOrders={orders} 
            loadError={loadError} 
          />
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('Server component error:', error);
    
    // Возвращаем fallback UI при ошибке
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Ошибка загрузки страницы
          </h1>
          <p className="text-gray-600 mb-6">
            Произошла ошибка при загрузке административной панели
          </p>
          <a 
            href="/admin/login" 
            className="inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            Вернуться к входу
          </a>
        </div>
      </div>
    );
  }
}