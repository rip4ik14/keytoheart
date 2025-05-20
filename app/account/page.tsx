import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';
import AccountClient from './_components/AccountClient';
import type { Order, OrderItem, UpsellDetail } from '@/types/order';

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
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session fetch error:', error.message);
      throw error;
    }

    if (session && session.user) {
      initialSession = {
        phone: session.user.phone || '',
        isAuthenticated: true,
      };

      const phone = session.user.phone || '';
      if (phone) {
        // Загружаем бонусы
        const { data: bonusesData, error: bonusesError } = await supabase
          .from('bonuses')
          .select('id, bonus_balance, level')
          .eq('phone', phone)
          .single();

        if (bonusesError && bonusesError.code !== 'PGRST116') {
          console.error('Bonuses fetch error:', bonusesError.message);
          throw new Error('Bonuses fetch error: ' + bonusesError.message);
        }

        initialBonusData = bonusesData
          ? { id: bonusesData.id, bonus_balance: bonusesData.bonus_balance, level: bonusesData.level, history: [] }
          : { id: null, bonus_balance: 0, level: 'bronze', history: [] };

        if (initialBonusData.id) {
          const { data: historyData, error: historyError } = await supabase
            .from('bonus_history')
            .select('amount, reason, created_at')
            .eq('bonus_id', initialBonusData.id);

          if (historyError) {
            console.error('Bonus history fetch error:', historyError.message);
            throw new Error('Bonus history fetch error: ' + historyError.message);
          }

          initialBonusData.history = historyData?.map((item) => ({
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

        if (!ordersRes.ok || !ordersResult.success) {
          console.error('Orders fetch error:', ordersResult.error || ordersRes.statusText);
          throw new Error('Orders fetch error: ' + (ordersResult.error || ordersRes.statusText));
        }

        initialOrders = (ordersResult.data || []).map((order: any) => ({
          id: order.id,
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