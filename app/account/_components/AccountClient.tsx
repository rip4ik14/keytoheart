// ✅ Путь: components/account/AccountClient.tsx
'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import TabsHeader from '@components/account/TabsHeader';
import PersonalForm from '@components/account/PersonalForm';
import OrdersList from '@components/account/OrdersList';
import ImportantDates from '@components/account/ImportantDates';
import BonusCard from '@components/account/BonusCard';
import BonusHistory from '@components/account/BonusHistory';
import AuthWithCall from '@components/AuthWithCall';

import UiButton from '@components/ui/UiButton';
import { LogOut, Loader2 } from 'lucide-react';

import type { Order } from '@/types/order';

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

// Нормализация номера: всегда +7XXXXXXXXXX (только для отображения)
function normalizePhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.length === 11 && cleaned.startsWith('7')) return `+${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('8')) return `+7${cleaned.slice(1)}`;
  if (cleaned.length === 10) return `+7${cleaned}`;
  return phone;
}

const containerVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function AccountClient({ initialSession, initialOrders, initialBonusData }: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'personal' | 'orders' | 'dates'>('personal');
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [bonusData, setBonusData] = useState<BonusesData | null>(initialBonusData);

  const [filterDays, setFilterDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    initialSession?.isAuthenticated || false,
  );
  const [phone, setPhone] = useState<string>(initialSession?.phone || '');

  // Проверка авторизации (кука user_phone)
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check-session', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const sessionData = await response.json();

      if (sessionData?.isAuthenticated) {
        setIsAuthenticated(true);
        setPhone(sessionData.phone || '');
      } else {
        setIsAuthenticated(false);
        setPhone('');
        setOrders([]);
        setBonusData(null);
      }
    } catch (error) {
      process.env.NODE_ENV !== 'production' &&
        console.error(`${new Date().toISOString()} AccountClient: Error checking session`, error);

      setIsAuthenticated(false);
      setPhone('');
      setOrders([]);
      setBonusData(null);
    }
  }, []);

  // Подписка на событие authChange
  useEffect(() => {
    const handleAuthChange = () => checkAuth();
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, [checkAuth]);

  const authFetch = useCallback(async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    });

    // Единый сценарий - если сессия умерла
    if (res.status === 401) {
      setIsAuthenticated(false);
      setPhone('');
      setOrders([]);
      setBonusData(null);
      toast('Сессия истекла, войдите снова', { icon: '🔒' });
      window.dispatchEvent(new Event('authChange'));
      router.refresh();
      throw new Error('unauthorized');
    }

    return res;
  }, [router]);

  // Перезагрузка данных аккаунта (phone для API не передаем - только cookie)
  const fetchAccountData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1) Сгораемость бонусов (если используешь этот сценарий)
      const expireRes = await authFetch('/api/account/bonuses', { method: 'POST' });
      const expireResult = await expireRes.json();
      if (expireRes.ok && expireResult?.success && Number(expireResult.expired || 0) > 0) {
        toast(`Сгорело ${expireResult.expired} бонусов за неактивность 6 месяцев`, { icon: '⚠️' });
      }

      // 2) Уровень лояльности
      const loyaltyRes = await authFetch('/api/account/update-loyalty', { method: 'POST' });
      const loyaltyResult = await loyaltyRes.json();
      if (!loyaltyRes.ok || !loyaltyResult?.success) {
        process.env.NODE_ENV !== 'production' &&
          console.error('Failed to update loyalty:', loyaltyResult?.error);
      }

      // 3) Бонусы
      const bonusesRes = await authFetch('/api/account/bonuses', { method: 'GET' });
      if (!bonusesRes.ok) throw new Error('Bonuses fetch error: ' + bonusesRes.statusText);
      const bonusesResult = await bonusesRes.json();
      if (!bonusesResult?.success) throw new Error('Bonuses fetch error: ' + bonusesResult?.error);

      let bonuses: BonusesData = bonusesResult.data;
      if (loyaltyResult?.success && loyaltyResult?.level) bonuses.level = loyaltyResult.level;

      // 4) Заказы
      const ordersRes = await authFetch('/api/account/orders', { method: 'GET' });
      if (!ordersRes.ok) throw new Error('Orders fetch error: ' + ordersRes.statusText);
      const ordersResult = await ordersRes.json();
      if (!ordersResult?.success) throw new Error('Orders fetch error: ' + ordersResult?.error);

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
          title: item.title || 'Неизвестный товар',
          cover_url: item.imageUrl || item.cover_url || item.coverUrl || null,
        })),
        upsell_details: (order.upsell_details || []).map((upsell: any) => ({
          title: upsell.title || 'Неизвестный товар',
          price: upsell.price || 0,
          quantity: upsell.quantity || 1,
          category: upsell.category || 'unknown',
        })),
      }));

      setBonusData(bonuses);
      setOrders(transformedOrders);

      window.gtag?.('event', 'view_account', { event_category: 'account' });
      if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'view_account');
    } catch (error: any) {
      if (error?.message !== 'unauthorized') {
        toast.error('Ошибка загрузки данных');
        setOrders([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAccountData();

    const orderSuccess = localStorage.getItem('orderSuccess');
    if (orderSuccess) {
      fetchAccountData();
      localStorage.removeItem('orderSuccess');
      toast.success('Заказ успешно оформлен!');
    }
  }, [isAuthenticated, fetchAccountData]);

  const handleAuthSuccess = async (p: string) => {
    setIsAuthenticated(true);
    setPhone(p);
    await fetchAccountData();
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setIsAuthenticated(false);
      setPhone('');
      setOrders([]);
      setBonusData(null);
      toast.success('Вы вышли из аккаунта');

      window.gtag?.('event', 'logout', { event_category: 'auth' });
      if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'logout');

      window.dispatchEvent(new Event('authChange'));
      router.refresh();
    } catch {
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

  // --- AUTH SCREEN ---
  if (!isAuthenticated) {
    return (
      <main className="min-h-[70vh] bg-white text-black" aria-label="Вход в личный кабинет">
        <Toaster position="top-center" />
        <div className="max-w-md mx-auto px-4 py-10">
          <motion.div
            className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.08)]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Вход в кабинет</h1>

            <div className="mt-5">
              <AuthWithCall onSuccess={handleAuthSuccess} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2" />
          </motion.div>
        </div>
      </main>
    );
  }

  // --- ACCOUNT ---
  return (
    <main className="bg-white text-black" aria-label="Личный кабинет">
      <Toaster position="top-center" />

      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-10">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Личный кабинет</h1>
            <p className="text-sm text-black/55">
              Телефон: <span className="font-semibold text-black/80">{normalizePhone(phone)}</span>
            </p>
          </div>

          <UiButton
            variant="brandOutline"
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-2xl px-5 py-3"
            aria-label="Выйти из аккаунта"
          >
            <span className="inline-flex items-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              {isLoading ? 'Выход...' : 'Выйти'}
            </span>
          </UiButton>
        </motion.div>

        <div className="mt-5">
          <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                className="flex justify-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="rounded-3xl border border-black/10 bg-white px-6 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] inline-flex items-center gap-2">
                  <Image
                    src="/icons/spinner.svg"
                    alt="Загрузка"
                    width={22}
                    height={22}
                    loading="lazy"
                    className="animate-spin"
                  />
                  <span className="text-sm text-black/70">Загружаем данные...</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {activeTab === 'personal' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 items-start">
                    <div className="lg:col-span-2 space-y-3 sm:space-y-6">
                      <PersonalForm onUpdate={fetchAccountData} phone={normalizePhone(phone)} />
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
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-black/10 bg-white p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight">Мои заказы</h2>
                          <p className="text-sm text-black/55 mt-1">
                            Выберите период и повторяйте заказ в один клик
                          </p>
                        </div>

                        <div className="w-full sm:w-auto">
                          <label htmlFor="filter-days" className="sr-only">
                            Показать заказы за период
                          </label>
                          <select
                            id="filter-days"
                            className="
                              w-full sm:w-auto
                              rounded-2xl border border-black/10 bg-white
                              px-4 py-3 text-sm
                              focus:outline-none focus:ring-2 focus:ring-black/20
                            "
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
                      </div>
                    </div>

                    {filteredOrders.length > 0 ? (
                      <OrdersList orders={filteredOrders} />
                    ) : (
                      <div className="rounded-3xl border border-black/10 bg-white p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                        <p className="text-black/60">Заказы за выбранный период отсутствуют</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'dates' && (
                  <ImportantDates phone={normalizePhone(phone)} onUpdate={fetchAccountData} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}