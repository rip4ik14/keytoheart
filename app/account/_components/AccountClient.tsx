'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IMaskInput } from 'react-imask';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import TabsHeader from '@components/account/TabsHeader';
import PersonalForm from '@components/account/PersonalForm';
import OrdersList from '@components/account/OrdersList';
import ImportantDates from '@components/account/ImportantDates';
import BonusCard from '@components/account/BonusCard';
import BonusHistory from '@components/account/BonusHistory';
import TrackedLink from '@components/TrackedLink';
import type { Database } from '@/lib/supabase/types_new';
import { createBrowserClient } from '@supabase/ssr';

const DEV_PHONE = process.env.NEXT_PUBLIC_DEV_PHONE || '+79180300643';

type Props = {
  initialSession: any;
  initialOrders: any[] | undefined;
  initialBonusData: any;
};

interface BonusesData {
  id: string | null;
  bonus_balance: number | null;
  level: string | null;
  history: BonusHistoryItem[];
}

interface BonusHistoryItem {
  amount: number;
  reason: string;
  created_at: string;
}

export default function AccountClient({
  initialOrders,
  initialBonusData,
}: Props) {
  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [activeTab, setActiveTab] = useState<'personal' | 'orders' | 'dates'>('personal');
  const [orders, setOrders] = useState<any[]>(initialOrders || []);
  const [bonusData, setBonusData] = useState<BonusesData | null>(initialBonusData);
  const [filterDays, setFilterDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [agreed, setAgreed] = useState(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const phoneInputRef = useRef<{ element: HTMLInputElement | null }>({ element: null });
  const codeInputRef = useRef<HTMLInputElement>(null);

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  // Проверяем авторизацию при загрузке компонента
  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const { phone: storedPhone, isAuthenticated: storedAuth } = JSON.parse(authData);
        if (storedAuth && storedPhone) {
          setIsAuthenticated(true);
          setPhone(storedPhone);
          const cookieValue = `auth=${JSON.stringify({ phone: storedPhone, isAuthenticated: true })}; path=/; max-age=604800; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
          document.cookie = cookieValue;
          console.log('Cookie set on client in AccountClient:', document.cookie);
        }
      } catch (error) {
        console.error('Ошибка парсинга auth из localStorage:', error);
        localStorage.removeItem('auth');
      }
    }
  }, []);

  const fetchAccountData = useCallback(async () => {
    if (!phone) {
      console.log('No phone found, skipping fetchAccountData');
      return;
    }

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

      setBonusData(bonusesData);
      setOrders(ordersRes.data || []);

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

  useEffect(() => {
    if (step === 'phone') phoneInputRef.current?.element?.focus();
    if (step === 'code') codeInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step === 'code' && resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendCooldown]);

  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = `+7${cleanPhone}`;
    if (fullPhone === DEV_PHONE && cleanPhone.length === 10 && agreed) {
      setIsLoading(true);
      fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      })
        .then(async (res) => {
          const result = await res.json();
          if (result.success) {
            setIsAuthenticated(true);
            localStorage.setItem('auth', JSON.stringify({ phone: fullPhone, isAuthenticated: true }));
            const cookieValue = `auth=${JSON.stringify({ phone: fullPhone, isAuthenticated: true })}; path=/; max-age=604800; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
            document.cookie = cookieValue;
            console.log('Cookie set after dev-login in AccountClient:', document.cookie);
            setPhone(fullPhone);
            toast.success('Авторизация для разработчика выполнена');
            router.refresh();
            window.gtag?.('event', 'login_dev', { event_category: 'auth' });
            window.ym?.(12345678, 'reachGoal', 'login_dev');
          } else {
            console.error('Ошибка dev-login:', result.error);
            toast.error(result.error || 'Ошибка авторизации');
          }
        })
        .catch((error) => {
          console.error('Ошибка при вызове dev-login:', error);
          toast.error('Ошибка сервера при авторизации');
        })
        .finally(() => setIsLoading(false));
    }
  }, [phone, agreed, router]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) {
      setPhoneError('Введите корректный номер телефона');
      return;
    }
    setPhoneError('');

    const fullPhone = '+7' + clean;
    if (fullPhone === DEV_PHONE) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const result = await res.json();
      if (result.success) {
        setStep('code');
        setResendCooldown(60);
        toast.success('Код отправлен на ваш номер!');
        window.gtag?.('event', 'phone_submit', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'phone_submit');
      } else {
        console.error('Ошибка отправки SMS:', result.error);
        toast.error(result.error || 'Не удалось отправить SMS-код.');
      }
    } catch (error) {
      console.error('Ошибка при отправке SMS:', error);
      toast.error('Не удалось отправить SMS-код.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendCooldown(60);
    await handlePhoneSubmit(new Event('submit') as any);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      toast.error('Введите корректный код из SMS (6 цифр)');
      return;
    }

    setIsLoading(true);
    try {
      const clean = phone.replace(/\D/g, '');
      const fullPhone = '+7' + clean;

      const res = await fetch('/api/auth/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code }),
      });
      const result = await res.json();
      if (result.success) {
        setIsAuthenticated(true);
        localStorage.setItem('auth', JSON.stringify({ phone: fullPhone, isAuthenticated: true }));
        const cookieValue = `auth=${JSON.stringify({ phone: fullPhone, isAuthenticated: true })}; path=/; max-age=604800; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
        document.cookie = cookieValue;
        console.log('Cookie set after verify in AccountClient:', document.cookie);
        setPhone(fullPhone);

        // Создаём профиль через API
        const createProfileRes = await fetch('/api/account/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone }),
        });
        const createProfileResult = await createProfileRes.json();
        if (!createProfileResult.success) {
          console.error('Ошибка создания профиля:', createProfileResult.error);
          toast.error('Ошибка создания профиля');
        }

        toast.success('Успешно вошли');
        router.refresh();
        window.gtag?.('event', 'login_success', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'login_success');
      } else {
        console.error('Ошибка верификации SMS:', result.error);
        toast.error(result.error || 'Неверный код. Попробуйте снова.');
      }
    } catch (error: any) {
      console.error('Ошибка проверки кода:', error);
      toast.error('Ошибка проверки кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setIsAuthenticated(false);
    localStorage.removeItem('auth');
    document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict'; // Удаляем cookie
    setPhone('');
    router.refresh();
    toast.success('Вы вышли из аккаунта');
    setIsLoading(false);
    window.gtag?.('event', 'logout', { event_category: 'auth' });
    window.ym?.(12345678, 'reachGoal', 'logout');
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
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
        <p className="text-gray-500">Введите номер телефона</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-heading"
          >
            <h2 id="login-heading" className="sr-only">Форма входа</h2>
            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4 text-left">
                <div className="flex gap-2 items-center">
                  <span className="pt-2 text-gray-600">+7</span>
                  <IMaskInput
                    mask="(000) 000-00-00"
                    value={phone}
                    onAccept={(value: any) => setPhone(value)}
                    placeholder="(___) ___-__-__"
                    className={`border px-4 py-2 rounded w-full text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black sm:px-5 sm:py-3 ${
                      phoneError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                    ref={phoneInputRef as any}
                    aria-label="Введите номер телефона"
                    aria-invalid={phoneError ? 'true' : 'false'}
                    aria-describedby={phoneError ? 'phone-error' : undefined}
                  />
                </div>
                {phoneError && (
                  <p id="phone-error" className="text-red-500 text-xs">{phoneError}</p>
                )}
                <div className="space-y-4">
                  <motion.button
                    type="submit"
                    disabled={!agreed || isLoading}
                    className={`w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition-all sm:py-4 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                      isLoading || !agreed ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Отправить код"
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
                        <span>Загрузка...</span>
                      </>
                    ) : (
                      'Отправить код'
                    )}
                  </motion.button>
                  <label className="flex items-start gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 focus:ring-2 focus:ring-black"
                      required
                      aria-label="Согласие с политикой конфиденциальности"
                    />
                    <span>
                      Нажимая на «Отправить код» вы соглашаетесь с{' '}
                      <TrackedLink
                        href="/policy"
                        ariaLabel="Перейти к политике конфиденциальности"
                        category="Navigation"
                        action="Click Policy Link"
                        label="Account Login"
                        className="underline hover:text-black focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        политикой хранения персональных данных
                      </TrackedLink>
                    </span>
                  </label>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <input
                  ref={codeInputRef}
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Код из SMS"
                  className="border px-4 py-2 rounded w-full text-center border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black sm:px-5 sm:py-3"
                  required
                  autoComplete="one-time-code"
                  aria-label="Введите код подтверждения"
                />
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition-all sm:py-4 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label="Подтвердить код"
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
                      <span>Проверка...</span>
                    </>
                  ) : (
                    'Подтвердить'
                  )}
                </motion.button>
                <div className="flex flex-col gap-2">
                  <motion.button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="w-full text-sm text-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-black"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Изменить номер телефона"
                  >
                    Изменить номер
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isLoading}
                    className={`w-full text-sm text-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-black ${
                      resendCooldown > 0 || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Отправить код повторно"
                  >
                    {resendCooldown > 0
                      ? `Отправить код повторно через ${resendCooldown} сек`
                      : 'Отправить код повторно'}
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
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