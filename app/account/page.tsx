import { cookies } from 'next/headers';
import AccountClient from './_components/AccountClient';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
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
  title: 'Личный кабинет - управление заказами',
  description:
    'Управляйте заказами, проверяйте бонусы и обновляйте данные в личном кабинете КЛЮЧ К СЕРДЦУ в Краснодаре. Вход 24/7!',
  keywords: ['личный кабинет', 'КЛЮЧ К СЕРДЦУ', 'заказы Краснодар', 'бонусы'],
  openGraph: {
    title: 'Личный кабинет | КЛЮЧ К СЕРДЦУ',
    description: 'Проверяйте заказы и бонусы в личном кабинете с доставкой в Краснодаре.',
    url: 'https://keytoheart.ru/account',
    images: [{ url: '/og-cover.webp', width: 1200, height: 630 }],
    type: 'website',
  },
  alternates: { canonical: 'https://keytoheart.ru/account' },
};

function toNum(v: any): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('user_phone')?.value ?? '';

  const initialSession = phone ? { phone, isAuthenticated: true } : null;

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
              },
            },
          },
        },
        upsell_details: true,
      },
    });

    // ✅ достаём картинки из Supabase products.images[0]
    const productIds = Array.from(
      new Set(
        (ordersRaw ?? [])
          .flatMap((o: any) => (o.order_items ?? []).map((it: any) => Number(it.product_id)))
          .filter((id: any) => Number.isFinite(id) && id > 0),
      ),
    );

    const imageMap = new Map<number, string | null>();

    if (productIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, images')
        .in('id', productIds);

      if (!error && Array.isArray(data)) {
        for (const p of data as any[]) {
          const id = Number(p?.id);
          const images = Array.isArray(p?.images) ? p.images : [];
          const first = typeof images?.[0] === 'string' ? images[0] : null;
          if (Number.isFinite(id)) imageMap.set(id, first);
        }
      }
    }

    initialOrders = (ordersRaw ?? []).map((orderRaw: any): Order => ({
      id: orderRaw.id,
      created_at: orderRaw.created_at?.toISOString() ?? '',
      total: toNum(orderRaw.total),
      bonuses_used: orderRaw.bonuses_used ?? 0,
      payment_method: orderRaw.payment_method ?? 'cash',
      status: orderRaw.status ?? '',
      recipient: orderRaw.recipient ?? '',
      items: (orderRaw.order_items ?? []).map((item: any): OrderItem => {
        const pid = Number(item.product_id ?? 0);
        return {
          product_id: pid,
          quantity: item.quantity,
          price: item.price,
          title: item.products?.title || 'Неизвестный товар',
          cover_url: imageMap.get(pid) ?? null,
        };
      }),
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
