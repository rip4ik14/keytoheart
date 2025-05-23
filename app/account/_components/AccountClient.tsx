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
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';
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
        auth: {
          autoRefreshToken: true,
          persistSession: true,
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
        if (error) throw error;
        if (user) {
          const normalizedPhone = normalizePhone(user.phone || '');
          setIsAuthenticated(true);
          setPhone(normalizedPhone);
          setOrders(initialOrders || []);
          setBonusData(initialBonusData);
        } else {
          setIsAuthenticated(false);
          setPhone('');
          setOrders([]);
          setBonusData(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setPhone('');
        setOrders([]);
        setBonusData(null);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      checkSession();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initialOrders, initialBonusData, supabase]);

  // Загружаем данные и вызываем expire-bonuses
  const fetchAccountData = useCallback(async () => {
    if (!phone || !supabase) return;
    const normalizedPhone = normalizePhone(phone);
    setIsLoading(true);
    try {
      // 1. Сгораемость бонусов
      await fetch('/api/account/expire-bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      })
        .then((res) => res.json())
        .then((expire) => {
          if (expire.success && expire.expired > 0) {
            toast(`Сгорело ${expire.expired} бонусов за неактивность 6 месяцев`, { icon: '⚠️' });
          }
        });

      // 2. Загружаем бонусы
      const bonusesRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(normalizedPhone)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!bonusesRes.ok) {
        throw new Error('Bonuses fetch error: ' + bonusesRes.statusText);
      }
      const bonusesResult = await bonusesRes.json();
      if (!bonusesResult.success) {
        throw new Error('Bonuses fetch error: ' + bonusesResult.error);
      }

      let bonuses: BonusesData = bonusesResult.data;
      if (bonuses.id) {
        const { data: historyData, error: historyError } = await supabase
          .from('bonus_history')
          .select('amount, reason, created_at')
          .eq('bonus_id', bonuses.id);

        if (historyError) {
          throw new Error('History fetch error: ' + historyError.message);
        }
        bonuses.history = historyData?.map((item: BonusHistoryItem) => ({
          amount: item.amount ?? 0,
          reason: item.reason ?? '',
          created_at: item.created_at ?? '',
        })) || [];
      }

      // 3. Загружаем заказы через API
      const ordersRes = await fetch(`/api/account/orders?phone=${encodeURIComponent(normalizedPhone)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!ordersRes.ok) {
        throw new Error('Orders fetch error: ' + ordersRes.statusText);
      }
      const ordersResult = await ordersRes.json();
      if (!ordersResult.success) {
        throw new Error('Orders fetch error: ' + ordersResult.error);
      }

      const transformedOrders: Order[] = (ordersResult.data || []).map((order: any) => ({
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

      // 4. Обновляем уровень лояльности
      const loyaltyRes = await fetch('/api/account/update-loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const loyaltyResult = await loyaltyRes.json();
      if (loyaltyRes.ok && loyaltyResult.success) {
        bonuses.level = loyaltyResult.level;
      }

      setBonusData(bonuses);
      setOrders(transformedOrders);

      window.gtag?.('event', 'view_account', { event_category: 'account' });
      window.ym?.(96644553, 'reachGoal', 'view_account');
    } catch (error: any) {
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
        fetchAccountData();
        localStorage.removeItem('orderSuccess');
        toast.success('Заказ успешно оформлен!');
      }
    }
  }, [isAuthenticated, fetchAccountData]);

  const handleAuthSuccess = (phone: string) => {
    setIsAuthenticated(true);
    const normalizedPhone = normalizePhone(phone);
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
