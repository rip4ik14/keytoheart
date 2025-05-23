import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminJwt } from '@/lib/auth';
import CustomersClient from './CustomersClient';

interface Event {
  type: string;
  date: string | null;
  description: string | null;
}

interface Customer {
  id: string;
  phone: string;
  email: string | null;
  created_at: string | null;
  important_dates: Event[];
  orders: any[];
  bonuses: { bonus_balance: number | null; level: string | null };
  bonus_history: any[];
}

export default async function CustomersPage() {
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

  let customers: Customer[] = [];

  try {
    // Получаем профили пользователей из user_profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, phone, email, created_at');

    if (profilesError) throw profilesError;

    for (const profile of profiles) {
      const phone = profile.phone;
      if (!phone) continue;

      // Важные даты
      const { data: dates } = await supabaseAdmin
        .from('important_dates')
        .select('type, date, description')
        .eq('phone', phone);

      // Заказы
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select(
          `
          id,
          created_at,
          total,
          bonuses_used,
          payment_method,
          status,
          order_items(
            quantity,
            price,
            product_id,
            products(title, cover_url)
          )
        `
        )
        .eq('phone', phone)
        .order('created_at', { ascending: false });

      // Бонусы
      const { data: bonuses } = await supabaseAdmin
        .from('bonuses')
        .select('bonus_balance, level')
        .eq('phone', phone)
        .single();

      // История бонусов
      const { data: bonusHistory } = await supabaseAdmin
        .from('bonus_history')
        .select('amount, reason, created_at')
        .eq('phone', phone)
        .order('created_at', { ascending: false });

      customers.push({
        id: profile.id,
        phone: phone || '—',
        email: profile.email || null,
        created_at: profile.created_at || null,
        important_dates: dates || [],
        orders: orders || [],
        bonuses: bonuses || { bonus_balance: null, level: null },
        bonus_history: bonusHistory || [],
      });
    }
  } catch (error: any) {
    console.error('Error fetching customers:', error);
  }

  return <CustomersClient customers={customers} />;
}