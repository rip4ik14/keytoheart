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
import type { Database } from '@/lib/supabase/types_new';
import { createBrowserClient } from '@supabase/ssr';

// Интерфейсы для типизации данных
interface Order {
  id: number;
  created_at: string;
  total: number;
  bonuses_used: number;
  payment_method: "cash" | "card";
  status: string;
  order_items: {
    quantity: number;
    price: number;
    product_id: number;
    products: { title: string; cover_url: string | null };
  }[];
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
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [activeTab, setActiveTab] = useState<'personal' | 'orders' | 'dates'>('personal');
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [bonusData, setBonusData] = useState<BonusesData | null>(initialBonusData);
  const [filterDays, setFilterDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialSession?.isAuthenticated || false);
  const [phone, setPhone] = useState<string>(initialSession?.phone || '');

  // Проверяем авторизацию при загрузке компонента
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/verify-session');
        const result = await response.json();

        if (result.success) {
          setIsAuthenticated(true);
          setPhone(result.phone);
          setOrders(initialOrders || []);
          setBonusData(initialBonusData);
        } else {
          setIsAuthenticated(false);
          setPhone('');
          setOrders([]);
          setBonusData(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsAuthenticated(false);
        setPhone('');
        setOrders([]);
        setBonusData(null);
      }
    };

    checkSession();
    // eslint-disable-next-line
  }, [initialOrders, initialBonusData]);

  // Загрузка данных после авторизации
  const fetchAccountData = useCallback(async () => {
    if (!phone) return;
    setIsLoading(true);
    try {
      const bonusesRes = await supabase
        .from('bonuses')
        .select('id, bonus_balance, level')
        .eq('phone', phone)
        .single();

      let bonusesData: BonusesData;
      if (bonusesRes.error && bonusesRes.error.code !== 'PGRST116') {
        console.error('Bonuses fetch error:', bonusesRes.error);
        throw new Error(`Bonuses fetch error: ${bonusesRes.error.message}`);
      }
      bonusesData = bonusesRes.data
        ? { ...bonusesRes.data, history: [] }
        : { id: null, bonus_balance: 0, level: 'basic', history: [] };

      if (bonusesData.id) {
        const historyRes = await supabase
          .from('bonus_history')
          .select('amount, reason, created_at')
          .eq('bonus_id', bonusesData.id);

        if (historyRes.error) {
          console.error('History fetch error:', historyRes.error);
          throw new Error(`History fetch error: ${historyRes.error.message}`);
        }
        bonusesData.history = historyRes.data.map((item) => ({
          amount: item.amount ?? 0,
          reason: item.reason ?? '',
          created_at: item.created_at ?? '',
        }));
      }

      const ordersRes = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total,
          bonuses_used,
          payment_method,
          status,
          order_items(
            quantity,
            price,
            product_id,
            products(title, image_url)
          )
        `)
        .eq('phone', phone)
        .order('created_at', { ascending: false });

      if (ordersRes.error) {
        console.error('Orders fetch error:', ordersRes.error);
        throw new Error(`Orders fetch error: ${ordersRes.error.message}`);
      }

      const transformedOrders: Order[] = (ordersRes.data || []).map((order: any) => {
        const paymentMethod = order.payment_method === 'card' ? 'card' : 'cash';
        return {
          id: parseInt(order.id, 10),
          created_at: order.created_at ?? '',
          total: order.total ?? 0,
          bonuses_used: order.bonuses_used ?? 0,
          payment_method: paymentMethod,
          status: order.status ?? '',
          order_items: order.order_items.map((item: any) => ({
            quantity: item.quantity,
            price: item.price,
            product_id: item.product_id ?? 0,
            products: item.products
              ? { title: item.products.title, cover_url: item.products.image_url }
              : { title: '', cover_url: '' },
          })),
        };
      });

      setBonusData(bonusesData);
      setOrders(transformedOrders);

      window.gtag?.('event', 'view_account', { event_category: 'account' });
      window.ym?.(12345678, 'reachGoal', 'view_account');
    } catch (error: any) {
      console.error('Error in fetchAccountData:', error.message);
      toast.error('Ошибка загрузки данных');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [phone, supabase]);

  useEffect(() => {
    if (isAuthenticated && !initialOrders?.length && !initialBonusData) {
      fetchAccountData();
    }
  }, [isAuthenticated, fetchAccountData, initialOrders, initialBonusData]);

  // ФИНАЛЬНЫЙ: Обработчик успешной авторизации — только телефон
  const handleAuthSuccess = (phone: string) => {
    setIsAuthenticated(true);
    setPhone(phone);
    localStorage.setItem('auth', JSON.stringify({ phone, isAuthenticated: true }));
    document.cookie = `auth=${JSON.stringify({ phone, isAuthenticated: true })}; path=/; max-age=604800; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    fetchAccountData();
  };

  // Выход
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        setIsAuthenticated(false);
        setPhone('');
        setOrders([]);
        setBonusData(null);
        localStorage.removeItem('auth');
        document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
        toast.success('Вы вышли из аккаунта');
        window.gtag?.('event', 'logout', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'logout');
      } else {
        toast.error('Ошибка при выходе из аккаунта');
      }
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
                  level={bonusData?.level ?? 'basic'}
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
            {activeTab === 'dates' && <ImportantDates />}
          </>
        )}
      </div>
    </main>
  );
}
