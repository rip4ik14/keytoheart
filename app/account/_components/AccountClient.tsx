'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import TabsHeader from '@components/account/TabsHeader';
import PersonalForm from '@components/account/PersonalForm';
import OrdersList from '@components/account/OrdersList';
import ImportantDates from '@components/account/ImportantDates';
import BonusCard from '@components/account/BonusCard';
import BonusHistory from '@components/account/BonusHistory';
import AuthWithCall from '@components/AuthWithCall';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types_new';

// Интерфейсы для типизации данных
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

interface Props {
  initialSession: { phone: string; isAuthenticated: boolean } | null;
  initialOrders: Order[] | undefined;
  initialBonusData: BonusesData | null;
}

export default function AccountClient({ initialSession, initialOrders, initialBonusData }: Props) {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'orders' | 'dates'>('personal');
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [bonusData, setBonusData] = useState<BonusesData | null>(initialBonusData);
  const [filterDays, setFilterDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialSession?.isAuthenticated || false);
  const [phone, setPhone] = useState<string>(initialSession?.phone || '');

  // Инициализация клиента Supabase
  useEffect(() => {
    const client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Accept: 'application/json',
          },
        },
      }
    );
    setSupabase(client);
  }, []);

  // Нормализация телефона
  const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('7') ? `+${cleaned}` : `+7${cleaned}`;
  };

  // Проверка авторизации
  useEffect(() => {
    if (!supabase) return;

    const checkSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log(`[${new Date().toISOString()}] Client user check:`, { user, error });
        if (error) {
          console.error('User check error:', error.message);
          throw error;
        }
        if (user) {
          setIsAuthenticated(true);
          const formattedPhone = normalizePhone(user.phone || '');
          console.log(`[${new Date().toISOString()}] Formatted phone: ${formattedPhone}`);
          setPhone(formattedPhone);
          setOrders(initialOrders || []);
          setBonusData(initialBonusData);
        } else {
          setIsAuthenticated(false);
          setPhone('');
          setOrders([]);
          setBonusData(null);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setIsAuthenticated(false);
        setPhone('');
        setOrders([]);
        setBonusData(null);
      }
    };

    checkSession();
  }, [initialOrders, initialBonusData, supabase]);

  // Загрузка данных
  const fetchAccountData = useCallback(async () => {
    if (!phone || !supabase) return;
    const normalizedPhone = normalizePhone(phone);
    console.log(`[${new Date().toISOString()}] Normalized phone for fetch: ${normalizedPhone}`);
    setIsLoading(true);
    try {
      console.log(`[${new Date().toISOString()}] Fetching account data for phone: ${normalizedPhone}`);

      // Загружаем бонусы через API
      const bonusesRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalizedPhone)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!bonusesRes.ok) {
        const text = await bonusesRes.text();
        console.error(`[${new Date().toISOString()}] Bonuses fetch failed:`, { status: bonusesRes.status, text });
        throw new Error(`Bonuses fetch error: ${text || 'Неизвестная ошибка'}`);
      }
      const bonusesResult = await bonusesRes.json();
      console.log(`[${new Date().toISOString()}] Bonuses response:`, bonusesResult);

      let bonuses: BonusesData;
      if (!bonusesResult.success) {
        console.error('Bonuses fetch error:', bonusesResult.error);
        throw new Error(`Bonuses fetch error: ${bonusesResult.error || 'Неизвестная ошибка'}`);
      }
      bonuses = bonusesResult.data;

      if (bonuses.id) {
        const { data: historyData, error: historyError } = await supabase
          .from('bonus_history')
          .select('amount, reason, created_at')
          .eq('bonus_id', bonuses.id);

        console.log(`[${new Date().toISOString()}] Bonus history response:`, { data: historyData, error: historyError });

        if (historyError) {
          console.error('History fetch error:', historyError);
          throw new Error(`History fetch error: ${historyError.message}`);
        }
        bonuses.history = historyData?.map((item: BonusHistoryItem) => ({
          amount: item.amount ?? 0,
          reason: item.reason ?? '',
          created_at: item.created_at ?? '',
        })) || [];
      }

      // Загружаем заказы через API
      const ordersRes = await fetch(`/api/account/orders?phone=${encodeURIComponent(normalizedPhone)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!ordersRes.ok) {
        const text = await ordersRes.text();
        console.error(`[${new Date().toISOString()}] Orders fetch failed:`, { status: ordersRes.status, text });
        throw new Error(`Orders fetch error: ${text || 'Неизвестная ошибка'}`);
      }
      const ordersResult = await ordersRes.json();
      console.log(`[${new Date().toISOString()}] Orders response:`, ordersResult);

      if (!ordersResult.success) {
        console.error('Orders fetch error:', ordersResult.error);
        throw new Error(`Orders fetch error: ${ordersResult.error || 'Неизвестная ошибка'}`);
      }

      const transformedOrders: Order[] = (ordersResult.data || []).map((order: Order) => ({
        id: order.id,
        created_at: order.created_at ?? '',
        total: order.total ?? 0,
        bonuses_used: order.bonuses_used ?? 0,
        payment_method: order.payment_method ?? 'cash',
        status: order.status ?? '',
        recipient: order.recipient || 'Не указан',
        items: (order.items || []).map((item: OrderItem) => ({
          quantity: item.quantity,
          price: item.price,
          product_id: item.product_id ?? 0,
          products: {
            title: item.products.title || 'Неизвестный товар',
            cover_url: item.products.cover_url || null,
          },
        })),
        upsell_details: (order.upsell_details || []).map((upsell: UpsellDetail) => ({
          title: upsell.title || 'Неизвестный товар',
          price: upsell.price || 0,
          quantity: upsell.quantity || 1,
          category: upsell.category || 'unknown',
        })),
      }));

      console.log(`[${new Date().toISOString()}] Fetched orders:`, transformedOrders);

      // Обновляем уровень лояльности
      const loyaltyRes = await fetch('/api/account/update-loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const loyaltyResult = await loyaltyRes.json();

      console.log(`[${new Date().toISOString()}] Loyalty update response:`, loyaltyResult);

      if (!loyaltyRes.ok || !loyaltyResult.success) {
        console.error('Loyalty update error:', loyaltyResult.error);
      } else {
        bonuses.level = loyaltyResult.level;
      }

      setBonusData(bonuses);
      setOrders(transformedOrders);

      window.gtag?.('event', 'view_account', { event_category: 'account' });
      window.ym?.(96644553, 'reachGoal', 'view_account');
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] Error in fetchAccountData:`, error.message);
      toast.error('Ошибка загрузки данных');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [phone, supabase]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccountData();
      const orderSuccess = localStorage.getItem('orderSuccess');
      if (orderSuccess) {
        console.log('Order success detected, refreshing data');
        fetchAccountData();
        localStorage.removeItem('orderSuccess');
        toast.success('Заказ успешно оформлен!');
      }
    }
  }, [isAuthenticated, fetchAccountData]);

  const handleAuthSuccess = (phone: string) => {
    setIsAuthenticated(true);
    const normalizedPhone = normalizePhone(phone);
    console.log(`[${new Date().toISOString()}] Auth success phone: ${normalizedPhone}`);
    setPhone(normalizedPhone);
    fetchAccountData();
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase?.auth.signOut();
      setIsAuthenticated(false);
      setPhone('');
      setOrders([]);
      setBonusData(null);
      toast.success('Вы вышли из аккаунта');
      window.gtag?.('event', 'logout', { event_category: 'auth' });
      window.ym?.(96644553, 'reachGoal', 'logout');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      toast.error('Ошибка при выходе из аккаунта');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      if (!o.created_at) return false;
      const orderDate = new Date(o.created_at);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filterDays);
      return orderDate >= cutoff;
    });
  }, [orders, filterDays]);

  if (!isAuthenticated) {
    return (
      <main className="max-w-sm mx-auto py-10 px-4 text-center space-y-6 sm:max-w-md" aria-label="Вход в личный кабинет">
        <Toaster position="top-center" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Вход в кабинет</h1>
        <p className="text-gray-500">Введите номер телефона для входа</p>
        <AuthWithCall onSuccess={handleAuthSuccess} />
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6 sm:px-6 lg:px-8" aria-label="Личный кабинет">
      <Toaster position="top-center" />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Личный кабинет</h1>
        <motion.button
          onClick={handleLogout}
          disabled={isLoading}
          className={`text-sm text-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black flex items-center gap-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Выйти из аккаунта"
        >
          {isLoading ? (
            <>
              <Image
                src="/icons/spinner.svg"
                alt="Иконка загрузки"
                width={20}
                height={20}
                loading="lazy"
                className="animate-spin"
              />
              <span>Выход...</span>
            </>
          ) : (
            'Выход'
          )}
        </motion.button>
      </div>
      <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="pt-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center">
            <Image
              src="/icons/spinner.svg"
              alt="Иконка загрузки"
              width={24}
              height={24}
              loading="lazy"
              className="animate-spin text-gray-500"
            />
          </div>
        ) : (
          <>
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <PersonalForm onUpdate={fetchAccountData} phone={phone} />
                  {bonusData?.history && bonusData.history.length > 0 && (
                    <BonusHistory history={bonusData.history} />
                  )}
                </div>
                <BonusCard
                  balance={bonusData?.bonus_balance ?? 0}
                  level={bonusData?.level ?? 'bronze'}
                />
              </div>
            )}
            {activeTab === 'orders' && (
              <>
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <label htmlFor="filter-days" className="sr-only">
                    Показать заказы за период
                  </label>
                  <select
                    id="filter-days"
                    className="border p-2 rounded bg-white border-gray-300 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-black"
                    value={filterDays}
                    onChange={(e) => setFilterDays(+e.target.value)}
                    aria-label="Фильтр по периоду заказов"
                  >
                    <option value={7}>7 дней</option>
                    <option value={30}>30 дней</option>
                    <option value={90}>90 дней</option>
                    <option value={365}>Год</option>
                    <option value={9999}>Все</option>
                  </select>
                </div>
                {filteredOrders.length > 0 ? (
                  <OrdersList orders={filteredOrders} />
                ) : (
                  <p className="text-gray-500 text-center">Заказы за выбранный период отсутствуют</p>
                )}
              </>
            )}
            {activeTab === 'dates' && <ImportantDates phone={phone} onUpdate={fetchAccountData} />}
          </>
        )}
      </div>
    </main>
  );
}