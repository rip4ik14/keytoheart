// app/admin/(protected)/customers/[id]/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';
import CustomerDetailClient from './CustomerDetailClient';

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

interface PageProps {
  params: { id: string };
}

export default async function CustomerPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    redirect('/admin/login?error=no-session');
  }

  const isValidToken = await verifyAdminJwt(token);
  if (!isValidToken) {
    redirect('/admin/login?error=invalid-session');
  }

  let customer: Customer | null = null;
  try {
    const profile = await prisma.user_profiles.findUnique({
      where: { id: params.id },
      select: { id: true, phone: true, email: true, created_at: true },
    });

    if (profile && profile.phone) {
      // Указали тип event явно!
      const dates = await prisma.important_dates.findMany({
        where: { phone: profile.phone },
        select: { type: true, date: true, description: true },
      });

      const important_dates: Event[] = dates.map(
        (event: { type: string; date: Date | null; description: string | null }) => ({
          ...event,
          date: event.date ? event.date.toISOString() : null,
        })
      );

      const orders = await prisma.orders.findMany({
        where: { phone: profile.phone },
        select: {
          id: true,
          created_at: true,
          total: true,
          bonuses_used: true,
          payment_method: true,
          status: true,
          order_items: {
            select: {
              quantity: true,
              price: true,
              product_id: true,
              products: { select: { title: true, image_url: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      const bonuses = await prisma.bonuses.findUnique({
        where: { phone: profile.phone },
        select: { bonus_balance: true, level: true },
      });

      const bonusHistory = await prisma.bonus_history.findMany({
        where: { user_id: profile.id },
        select: { amount: true, reason: true, created_at: true },
        orderBy: { created_at: 'desc' },
      });

      customer = {
        id: profile.id,
        phone: profile.phone,
        email: profile.email,
        created_at: profile.created_at ? profile.created_at.toISOString() : null,
        important_dates,
        orders,
        bonuses: bonuses || { bonus_balance: null, level: null },
        bonus_history: bonusHistory,
      };
    }
  } catch (error: any) {
    console.error('Error fetching customer:', error);
  }

  return <CustomerDetailClient customer={customer} />;
}
