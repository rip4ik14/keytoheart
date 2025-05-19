import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';
import AccountClient from './_components/AccountClient';

interface OrderItem {
  products: { title: string; cover_url: string | null };
  quantity: number;
  price: number;
  product_id: number;
}

interface UpsellDetail {
  title: string;
  price: number;
  quantity: number;
  category: string;
}

interface Order {
  id: number;
  created_at: string;
  total: number;
  bonuses_used: number;
  payment_method: 'cash' | 'card';
  status: string;
  items: OrderItem[];
  upsell_details: UpsellDetail[];
  recipient?: string;
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

export default async function AccountPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
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

  let initialSession: { phone: string; isAuthenticated: boolean } | null = null;
  let initialOrders: Order[] = [];
  let initialBonusData: BonusesData | null = null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      initialSession = {
        phone: session.user.phone || '',
        isAuthenticated: true,
      };

      const phone = session.user.phone || '';
      if (phone) {
        // Загружаем бонусы
        const bonusesRes = await supabase
          .from('bonuses')
          .select('id, bonus_balance, level')
          .eq('phone', phone)
          .single();

        initialBonusData = bonusesRes.data
          ? { ...bonusesRes.data, history: [] }
          : { id: null, bonus_balance: 0, level: 'basic', history: [] };

        if (initialBonusData.id) {
          const historyRes = await supabase
            .from('bonus_history')
            .select('amount, reason, created_at')
            .eq('bonus_id', initialBonusData.id);

          initialBonusData.history = historyRes.data?.map((item) => ({
            amount: item.amount ?? 0,
            reason: item.reason ?? '',
            created_at: item.created_at ?? '',
          })) || [];
        }

        // Загружаем заказы через API
        const ordersRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/account/orders?phone=${encodeURIComponent(phone)}`,
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        const ordersResult = await ordersRes.json();

        if (ordersRes.ok && ordersResult.success) {
          initialOrders = (ordersResult.data || []).map((order: any) => ({
            id: parseInt(order.id, 10),
            created_at: order.created_at ?? '',
            total: order.total ?? 0,
            bonuses_used: order.bonuses_used ?? 0,
            payment_method: order.payment_method ?? 'cash',
            status: order.status ?? '',
            recipient: order.recipient || 'Не указан',
            items: (order.items || []).map((item: any) => ({
              quantity: item.quantity,
              price: item.price,
              product_id: item.product_id ?? 0,
              products: {
                title: item.title || 'Неизвестный товар',
                cover_url: item.imageUrl || null,
              },
            })),
            upsell_details: (order.upsell_details || []).map((upsell: any) => ({
              title: upsell.title || 'Неизвестный товар',
              price: upsell.price || 0,
              quantity: upsell.quantity || 1,
              category: upsell.category || 'unknown',
            })),
          }));
        }
      }
    }
  } catch (error) {
    console.error('Server error in AccountPage:', error);
  }

  return (
    <AccountClient
      initialSession={initialSession}
      initialOrders={initialOrders}
      initialBonusData={initialBonusData}
    />
  );
}