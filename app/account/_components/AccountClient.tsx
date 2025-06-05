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

// Нормализация номера: всегда +7XXXXXXXXXX
function normalizePhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('7') ? `+${cleaned}` : `+7${cleaned}`;
}

export default function AccountClient({ initialSession, initialOrders, initialBonusData }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'personal' | 'orders' | 'dates'>('personal');
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [bonusData, setBonusData] = useState<BonusesData | null>(initialBonusData);
  const [filterDays, setFilterDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialSession?.isAuthenticated || false);
  const [phone, setPhone] = useState<string>(initialSession?.phone || '');

  // Проверка авторизации (кука user_phone)
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check-session', {
        method: 'GET',
        credentials: 'include',
      });
      const sessionData = await response.json();
      
      if (sessionData.isAuthenticated) {
        setIsAuthenticated(true);
        setPhone(sessionData.phone || '');
      } else {
        setIsAuthenticated(false);
        setPhone('');
        setOrders([]);
        setBonusData(null);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} AccountClient: Error checking session`, error);
      setIsAuthenticated(false);
      setPhone('');
      setOrders([]);
      setBonusData(null);
    }
  }, []);

  // Подписка на событие authChange
  useEffect(() => {
    const handleAuthChange = () => {
     checkAuth();
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [checkAuth]);

  // Повторная загрузка данных аккаунта с нормализацией телефона
  const fetchAccountData = useCallback(async () => {
    if (!phone) return;
    const phoneForApi = normalizePhone(phone);
    setIsLoading(true);
    try {
      // 1. Сгораемость бонусов
      const expireRes = await fetch('/api/account/expire-bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneForApi }),
      });
      const expireResult = await expireRes.json();
      if (expireRes.ok && expireResult.success && expireResult.expired > 0) {
        toast(`Сгорело ${expireResult.expired} бонусов за неактивность 6 месяцев`, { icon: '⚠️' });
      }

      // 2. Обновляем уровень лояльности
      const loyaltyRes = await fetch('/api/account/update-loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneForApi }),
      });
      const loyaltyResult = await loyaltyRes.json();
      if (!loyaltyRes.ok || !loyaltyResult.success) {
        process.env.NODE_ENV !== "production" && console.error('Failed to update loyalty:', loyaltyResult.error);
      }

      // 3. Загружаем бонусы (после expire-bonuses и update-loyalty)
      const bonusesRes = await fetch(`/api/account/bonuses?phone=${encodeURIComponent(phoneForApi)}`, {
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

      // Устанавливаем уровень из loyaltyResult, если он был обновлён
      if (loyaltyResult.success) {
        bonuses.level = loyaltyResult.level;
      }

      // 4. Загружаем заказы через API
      const ordersRes = await fetch(`/api/account/orders?phone=${encodeURIComponent(phoneForApi)}`, {
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
          title: item.title || 'Неизвестный товар',
          cover_url: item.imageUrl || null,
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
      window.ym?.(96644553, 'reachGoal', 'view_account');
    } catch (error: any) {
      toast.error('Ошибка загрузки данных');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [phone]);

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

  // Логика успешной авторизации по звонку
  const handleAuthSuccess = (phone: string) => {
    setIsAuthenticated(true);
    setPhone(phone);
    fetchAccountData();
  };

  // Выход — удаляем куку user_phone (через API), обновляем стейт
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setPhone('');
      setOrders([]);
      setBonusData(null);
      toast.success('Вы вышли из аккаунта');
      window.gtag?.('event', 'logout', { event_category: 'auth' });
      window.ym?.(96644553, 'reachGoal', 'logout');
      // Отправляем кастомное событие после выхода
      window.dispatchEvent(new Event('authChange'));
      router.refresh();
    } catch {
      toast.error('Ошибка при выходе из аккаунта');
    } finally {
      setIsLoading(false);
    }
  };

  // Фильтр заказов
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

  // --- Рендер ---
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
            {activeTab === 'dates' && <ImportantDates phone={normalizePhone(phone)} onUpdate={fetchAccountData} />}
          </>
        )}
      </div>
    </main>
  );
}