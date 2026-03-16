// ✅ Путь: app/admin/(protected)/customers/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyAdminJwt } from '@/lib/auth';

import CustomersClient from './CustomersClient';

interface BonusHistoryEntry {
  amount: number;
  reason: string | null;
  created_at: string | null;
}

interface OrderItem {
  quantity: number;
  price: number;
  product_id: number | null;
  products: {
    title: string;
    image_url: string | null;
  } | null;
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

interface Event {
  type: string;
  date: string | null;
  description: string | null;
}

interface Customer {
  id: string; // uuid профиля или guest:+7...
  phone: string;
  email: string | null;
  created_at: string | null;

  // ✅ marketing consent
  receive_offers: boolean | null;
  receive_offers_at: string | null;
  receive_offers_source: string | null;
  receive_offers_version: string | null;
  receive_offers_ip: string | null;
  receive_offers_ua: string | null;

  important_dates: Event[];
  orders: Order[];
  bonuses: { bonus_balance: number | null; level: string | null };
  bonus_history: BonusHistoryEntry[];
  is_registered: boolean;
}

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null;
}

export default async function CustomersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) redirect('/admin/login?error=no-session');

  const isValidToken = await verifyAdminJwt(token);
  if (!isValidToken) redirect('/admin/login?error=invalid-session');

  let customers: Customer[] = [];

  try {
    // 1) Профили (user_profiles)
    const profiles = await prisma.user_profiles.findMany({
      select: {
        id: true,
        phone: true,
        email: true,
        created_at: true,

        receive_offers: true,
        receive_offers_at: true,
        receive_offers_source: true,
        receive_offers_version: true,
        receive_offers_ip: true,
        receive_offers_ua: true,
      },
    });

    const profileByPhone = new Map(
      profiles
        .filter((p) => (p.phone || '').trim())
        .map((p) => [(p.phone || '').trim(), p])
    );

    // 2) Все телефоны из заказов
    const orderPhonesRaw = await prisma.orders.findMany({
      where: { phone: { not: null } },
      distinct: ['phone'],
      select: { phone: true },
    });

    const phonesFromOrders = orderPhonesRaw
      .map((x) => (x.phone || '').trim())
      .filter(Boolean);

    const allPhones = Array.from(new Set([...Array.from(profileByPhone.keys()), ...phonesFromOrders]));

    // 3) Реальная регистрация = есть auth.users с таким phone
    const authUsers = allPhones.length
      ? await prisma.users.findMany({
          where: { phone: { in: allPhones } },
          select: { phone: true },
        })
      : [];

    const registeredPhones = new Set(authUsers.map((u) => (u.phone || '').trim()).filter(Boolean));

    const buildCustomerByPhone = async ({
      id,
      phone,
      email,
      created_at,

      receive_offers,
      receive_offers_at,
      receive_offers_source,
      receive_offers_version,
      receive_offers_ip,
      receive_offers_ua,

      is_registered,
    }: {
      id: string;
      phone: string;
      email: string | null;
      created_at: Date | null;

      receive_offers: boolean | null;
      receive_offers_at: Date | null;
      receive_offers_source: string | null;
      receive_offers_version: string | null;
      receive_offers_ip: string | null;
      receive_offers_ua: string | null;

      is_registered: boolean;
    }): Promise<Customer> => {
      const dates = await prisma.important_dates.findMany({
        where: { phone },
        select: { type: true, date: true, description: true },
      });

      const important_dates: Event[] = dates.map((event: any) => ({
        ...event,
        date: toIso(event.date),
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

      const orders: Order[] = ordersRaw.map((order: any) => ({
        ...order,
        created_at: toIso(order.created_at),
        total: order.total ? Number(order.total) : 0,
        bonuses_used: order.bonuses_used ? Number(order.bonuses_used) : 0,
        order_items: order.order_items,
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

      const bonus_history: BonusHistoryEntry[] = bonusHistoryRaw.map((entry: any) => ({
        amount: entry.amount ? Number(entry.amount) : 0,
        reason: entry.reason,
        created_at: toIso(entry.created_at),
      }));

      return {
        id,
        phone,
        email,
        created_at: toIso(created_at),

        receive_offers,
        receive_offers_at: toIso(receive_offers_at),
        receive_offers_source,
        receive_offers_version,
        receive_offers_ip,
        receive_offers_ua,

        important_dates,
        orders,
        bonuses: bonuses
          ? { bonus_balance: bonuses.bonus_balance ?? 0, level: bonuses.level }
          : { bonus_balance: 0, level: null },
        bonus_history,
        is_registered,
      };
    };

    for (const phone of allPhones) {
      const p: any = profileByPhone.get(phone);
      const is_registered = registeredPhones.has(phone);

      customers.push(
        await buildCustomerByPhone({
          id: p?.id ? p.id : `guest:${phone}`,
          phone,
          email: p?.email || null,
          created_at: p?.created_at || null,

          receive_offers: p?.receive_offers ?? false,
          receive_offers_at: p?.receive_offers_at ?? null,
          receive_offers_source: p?.receive_offers_source ?? null,
          receive_offers_version: p?.receive_offers_version ?? null,
          receive_offers_ip: p?.receive_offers_ip ?? null,
          receive_offers_ua: p?.receive_offers_ua ?? null,

          is_registered,
        })
      );
    }
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('Error fetching customers:', error);
  }

  return <CustomersClient customers={customers} />;
}