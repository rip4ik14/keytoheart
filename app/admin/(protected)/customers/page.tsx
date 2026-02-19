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
  id: string;
  phone: string;
  email: string | null;
  created_at: string | null;
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
    // 1) Зарегистрированные профили
    const profiles = await prisma.user_profiles.findMany({
      select: { id: true, phone: true, email: true, created_at: true },
    });

    const profilePhones = new Set(
      profiles
        .map((p) => (p.phone || '').trim())
        .filter(Boolean)
    );

    // 2) Гости - телефоны из заказов, которых нет в user_profiles
    const orderPhonesRaw = await prisma.orders.findMany({
      where: { phone: { not: null } },
      distinct: ['phone'],
      select: { phone: true },
    });

    const guestPhones = orderPhonesRaw
      .map((x) => (x.phone || '').trim())
      .filter((phone) => phone && !profilePhones.has(phone));

    // Хелпер - собрать карточку клиента по телефону
    const buildCustomerByPhone = async ({
      id,
      phone,
      email,
      created_at,
      is_registered,
    }: {
      id: string;
      phone: string;
      email: string | null;
      created_at: Date | null;
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

      let bonus_history: BonusHistoryEntry[] = [];

      // История бонусов есть только если есть реальный user_id
      if (is_registered) {
        const bonusHistoryRaw = await prisma.bonus_history.findMany({
          where: { user_id: id },
          select: { amount: true, reason: true, created_at: true },
          orderBy: { created_at: 'desc' },
        });

        bonus_history = bonusHistoryRaw.map((entry: any) => ({
          amount: entry.amount ? Number(entry.amount) : 0,
          reason: entry.reason,
          created_at: toIso(entry.created_at),
        }));
      }

      return {
        id,
        phone,
        email,
        created_at: toIso(created_at),
        important_dates,
        orders,
        bonuses: bonuses
          ? {
              bonus_balance: bonuses.bonus_balance ? Number(bonuses.bonus_balance) : null,
              level: bonuses.level,
            }
          : { bonus_balance: null, level: null },
        bonus_history,
        is_registered,
      };
    };

    // 3) Собираем список: зарегистрированные
    for (const profile of profiles) {
      const phone = (profile.phone || '').trim();
      if (!phone) continue;

      customers.push(
        await buildCustomerByPhone({
          id: profile.id,
          phone,
          email: profile.email || null,
          created_at: profile.created_at,
          is_registered: true,
        })
      );
    }

    // 4) Добавляем гостей (id делаем синтетическим, чтобы не конфликтовал с uuid)
    for (const phone of guestPhones) {
      customers.push(
        await buildCustomerByPhone({
          id: `guest:${phone}`,
          phone,
          email: null,
          created_at: null,
          is_registered: false,
        })
      );
    }
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('Error fetching customers:', error);
  }

  return <CustomersClient customers={customers} />;
}
