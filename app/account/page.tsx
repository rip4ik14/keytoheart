// ✅ Исправленный: app/account/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
  // cookies() возвращает Promise<ReadonlyRequestCookies>, поэтому используем await
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  // Проверяем сессию на сервере
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let initialSession: { phone: string; isAuthenticated: boolean } | null = null;
  let initialOrders: Order[] = [];
  let initialBonusData: BonusesData | null = null;

  if (session) {
    const phone = session.user.phone || '';
    initialSession = { phone, isAuthenticated: true };

    // Загружаем заказы
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        bonuses_used,
        payment_method,
        status,
        recipient,
        order_items(
          quantity,
          price,
          product_id,
          products(title, cover_url)
        ),
        upsell_details
      `)
      .eq('phone', phone)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Orders fetch error:', ordersError);
    } else {
      initialOrders = (ordersData || []).map((order: any) => ({
        id: parseInt(order.id, 10),
        created_at: order.created_at ?? '',
        total: order.total ?? 0,
        bonuses_used: order.bonuses_used ?? 0,
        payment_method: order.payment_method ?? 'cash',
        status: order.status ?? '',
        recipient: order.recipient || 'Не указан',
        items: (order.order_items || []).map((item: any) => ({
          quantity: item.quantity,
          price: item.price,
          product_id: item.product_id ?? 0,
          products: {
            title: item.products?.title || 'Неизвестный товар',
            cover_url: item.products?.cover_url || null,
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

    // Загружаем бонусы
    const { data: bonusesData, error: bonusesError } = await supabase
      .from('bonuses')
      .select('id, bonus_balance, level')
      .eq('phone', phone)
      .single();

    if (bonusesError && bonusesError.code !== 'PGRST116') {
      console.error('Bonuses fetch error:', bonusesError);
    } else {
      initialBonusData = bonusesData
        ? { ...bonusesData, history: [] }
        : { id: null, bonus_balance: 0, level: 'basic', history: [] };

      if (initialBonusData?.id) {
        const { data: historyData, error: historyError } = await supabase
          .from('bonus_history')
          .select('amount, reason, created_at')
          .eq('bonus_id', initialBonusData.id);

        if (historyError) {
          console.error('History fetch error:', historyError);
        } else {
          initialBonusData.history = historyData.map((item: any) => ({
            amount: item.amount ?? 0,
            reason: item.reason ?? '',
            created_at: item.created_at ?? '',
          }));
        }
      }
    }
  }

  return (
    <AccountClient
      initialSession={initialSession}
      initialOrders={initialOrders}
      initialBonusData={initialBonusData}
    />
  );
}