import { cookies } from 'next/headers';
import AccountClient from './_components/AccountClient';
import { prisma } from '@/lib/prisma';
import type { Order, OrderItem } from '@/types/order';

// Определение типа Metadata вручную, если импорт не работает
interface Metadata {
  title?: string;
  description?: string;
  keywords?: string[];
  openGraph?: {
    title?: string;
    description?: string;
    images?: { url: string; width?: number; height?: number }[];
    url?: string;
    type?: string;
  };
  alternates?: { canonical?: string };
}

interface BonusHistoryItem {
  amount: number;
  reason: string;
  created_at: string;
}

interface BonusesData {
  id: string | null;
  bonus_balance: number | null;
  level: string | null;
  history: BonusHistoryItem[];
}

export const metadata: Metadata = {
  title: 'Личный кабинет — управление заказами | KEY TO HEART',
  description: 'Управляйте заказами, проверяйте бонусы и обновляйте данные в личном кабинете KEY TO HEART в Краснодаре. Вход 24/7!',
  keywords: ['личный кабинет', 'KEY TO HEART', 'заказы Краснодар', 'бонусы'],
  openGraph: {
    title: 'Личный кабинет | KEY TO HEART',
    description: 'Проверяйте заказы и бонусы в личном кабинете с доставкой в Краснодаре.',
    url: 'https://keytoheart.ru/account',
    images: [{ url: '/og-cover.webp', width: 1200, height: 630 }],
    type: 'website',
  },
  alternates: { canonical: 'https://keytoheart.ru/account' },
};

export default async function AccountPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('user_phone')?.value ?? '';

  const initialSession = phone
    ? { phone, isAuthenticated: true }
    : null;

  let initialBonusData: BonusesData | null = null;
  let initialOrders: Order[] = [];

  if (phone) {
    const bonusesData = await prisma.bonuses.findUnique({
      where: { phone },
      select: {
        id: true,
        bonus_balance: true,
        level: true,
        bonus_history: {
          select: {
            amount: true,
            reason: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    initialBonusData = bonusesData
      ? {
          id: bonusesData.id,
          bonus_balance: bonusesData.bonus_balance,
          level: bonusesData.level,
          history: (bonusesData.bonus_history ?? []).map((entry: any): BonusHistoryItem => ({
            amount: Number(entry.amount ?? 0),
            reason: entry.reason ?? '',
            created_at: entry.created_at?.toISOString() ?? '',
          })),
        }
      : { id: null, bonus_balance: 0, level: 'bronze', history: [] };

    const ordersRaw = await prisma.orders.findMany({
      where: { phone },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        total: true,
        bonuses_used: true,
        payment_method: true,
        status: true,
        recipient: true,
        order_items: {
          select: {
            quantity: true,
            price: true,
            product_id: true,
            products: {
              select: {
                title: true,
                image_url: true,
              },
            },
          },
        },
        upsell_details: true,
      },
    });

    initialOrders = (ordersRaw ?? []).map((orderRaw: any): Order => ({
      id: orderRaw.id,
      created_at: orderRaw.created_at?.toISOString() ?? '',
      total: Number(orderRaw.total ?? 0),
      bonuses_used: orderRaw.bonuses_used ?? 0,
      payment_method: orderRaw.payment_method ?? 'cash',
      status: orderRaw.status ?? '',
      recipient: orderRaw.recipient ?? '',
      items: (orderRaw.order_items ?? []).map((item: any): OrderItem => ({
        product_id: item.product_id ?? 0,
        quantity: item.quantity,
        price: item.price,
        title: item.products?.title || 'Неизвестный товар',
        cover_url: item.products?.image_url || null,
      })),
      upsell_details: Array.isArray(orderRaw.upsell_details) ? orderRaw.upsell_details : [],
    }));
  }

  return (
    <AccountClient
      initialSession={initialSession}
      initialOrders={initialOrders}
      initialBonusData={initialBonusData}
    />
  );
}