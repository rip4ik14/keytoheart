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

interface OrderItem {
  quantity: number;
  price: number;
  product_id: number | null;
  products: { title: string; image_url: string | null } | null;
}

interface Order {
  id: string;
  created_at: string | null;
  total: number;
  bonuses_used: number;
  payment_method: string | null;
  status: string | null;
  order_items: OrderItem[];
}

interface BonusHistoryEntry {
  amount: number;
  reason: string | null;
  created_at: string | null;
}

interface Customer {
  id: string;
  phone: string;
  email: string | null;
  created_at: string | null;
  important_dates: Event[];
  orders: Order[];
  bonuses: { bonus_balance: number | null; level: string | null };
  bonus_history: BonusHistoryEntry[];
  is_registered?: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null;
}

function decimalToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'object' && v && typeof v.toNumber === 'function') return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default async function CustomerPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) redirect('/admin/login?error=no-session');

  const isValidToken = await verifyAdminJwt(token);
  if (!isValidToken) redirect('/admin/login?error=invalid-session');

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  let phone: string | null = null;

  if (id.startsWith('guest:')) {
    phone = id.replace('guest:', '').trim();
  } else {
    const profile = await prisma.user_profiles.findUnique({
      where: { id },
      select: { phone: true },
    });
    phone = (profile?.phone || '').trim() || null;
  }

  if (!phone) {
    return <CustomerDetailClient customer={null} />;
  }

  // Профиль может быть, может не быть
  const profile = await prisma.user_profiles.findUnique({
    where: { phone },
    select: { id: true, phone: true, email: true, created_at: true },
  });

  // Реальная регистрация = есть auth.users
  const authUser = await prisma.users.findFirst({
    where: { phone },
    select: { phone: true },
  });

  const dates = await prisma.important_dates.findMany({
    where: { phone },
    select: { type: true, date: true, description: true },
  });

  const important_dates: Event[] = dates.map((e: any) => ({
    type: e.type,
    date: toIso(e.date),
    description: e.description ?? null,
  }));

  const ordersRaw = await prisma.orders.findMany({
    where: { phone },
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

  const orders: Order[] = ordersRaw.map((o: any) => ({
    ...o,
    created_at: toIso(o.created_at),
    total: Math.floor(decimalToNumber(o.total)),
    bonuses_used: Math.floor(decimalToNumber(o.bonuses_used)),
    order_items: o.order_items?.map((it: any) => ({
      ...it,
      price: Math.floor(decimalToNumber(it.price)),
    })),
  }));

  const bonuses = await prisma.bonuses.findUnique({
    where: { phone },
    select: { bonus_balance: true, level: true },
  });

  const bonusHistoryRaw = await prisma.bonus_history.findMany({
    where: { phone },
    select: { amount: true, reason: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });

  const bonus_history: BonusHistoryEntry[] = bonusHistoryRaw.map((b: any) => ({
    amount: Math.floor(decimalToNumber(b.amount)),
    reason: b.reason ?? null,
    created_at: toIso(b.created_at),
  }));

  const customer: Customer = {
    id: profile?.id || `guest:${phone}`,
    phone,
    email: profile?.email || null,
    created_at: toIso(profile?.created_at || null),
    important_dates,
    orders,
    bonuses: bonuses
      ? { bonus_balance: bonuses.bonus_balance ?? 0, level: bonuses.level }
      : { bonus_balance: 0, level: null },
    bonus_history,
    is_registered: Boolean(authUser),
  };

  return <CustomerDetailClient customer={customer} />;
}
