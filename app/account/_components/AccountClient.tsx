'use client';

import { useState, useEffect, useCallback, useMemo, useRef, MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
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

const DEV_PHONE = process.env.NEXT_PUBLIC_DEV_PHONE || '+79180300643';

type Props = {
  initialSession: any;
  initialOrders: any[] | undefined;
  initialBonusData: any;
};

export default function AccountClient({
  initialSession,
  initialOrders,
  initialBonusData,
}: Props) {
  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [session, setSession] = useState<any>(initialSession);
  const [activeTab, setActiveTab] = useState<'personal' | 'orders' | 'dates'>('personal');
  const [orders, setOrders] = useState<any[]>(initialOrders || []);
  const [bonusData, setBonusData] = useState<any>(initialBonusData);
  const [filterDays, setFilterDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [agreed, setAgreed] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const phoneInputRef = useRef<{ element: HTMLInputElement | null }>({ element: null });
  const codeInputRef = useRef<HTMLInputElement>(null);

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Fetched session in AccountClient:', session);
      setSession(session);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed in AccountClient:', session);
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const fetchAccountData = useCallback(async () => {
    if (!session?.user?.user_metadata?.phone) {
      console.log('No phone metadata found in session, skipping fetchAccountData');
      return;
    }

    setIsLoading(true);
    try {
      const phone = session.user.user_metadata.phone;
      const [bonusesRes, ordersRes] = await Promise.all([
        supabase
          .from('bonuses')
          .select('bonus_balance, level, history:bonus_history(amount,reason,created_at)')
          .eq('phone', phone)
          .single(),
        supabase
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
              products(title, cover_url)
            )
          `)
          .eq('phone', phone)
          .order('created_at', { ascending: false }),
      ]);

      if (bonusesRes.error) throw bonusesRes.error;
      if (ordersRes.error) throw ordersRes.error;

      console.log('Fetched bonus data:', bonusesRes.data);
      console.log('Fetched orders data:', ordersRes.data);

      setBonusData(bonusesRes.data);
      setOrders(ordersRes.data || []);

      window.gtag?.('event', 'view_account', { event_category: 'account' });
      window.ym?.(12345678, 'reachGoal', 'view_account');
    } catch (error: any) {
      console.error('Error in fetchAccountData:', error);
      toast.error('Ошибка загрузки данных');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    console.log('Initial orders:', initialOrders);
    console.log('Initial bonus data:', initialBonusData);
    if (session && !initialOrders?.length && !initialBonusData) {
      fetchAccountData();
    }
  }, [session, fetchAccountData, initialOrders, initialBonusData]);

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
            const { access_token, refresh_token } = result;
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;

            toast.success('Авторизация для разработчика выполнена');
            router.refresh();
            window.gtag?.('event', 'login_dev', { event_category: 'auth' });
            window.ym?.(12345678, 'reachGoal', 'login_dev');
          } else {
            toast.error('Ошибка авторизации');
          }
        })
        .catch(() => {
          toast.error('Ошибка сервера при авторизации');
        })
        .finally(() => setIsLoading(false));
    }
  }, [phone, agreed, supabase, router]);

  const filteredOrders = useMemo(() => {
    if (!orders) {
      console.log('Orders is undefined in filteredOrders');
      return [];
    }
    console.log('Filtering orders:', orders);
    return orders.filter((o) => {
      const orderDate = new Date(o.created_at);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filterDays);
      return orderDate >= cutoff;
    });
  }, [orders, filterDays]);

  // Восстановленные функции
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
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;

      toast.success('Код отправлен в SMS');
      setStep('code');
      setResendCooldown(60);
      window.gtag?.('event', 'phone_submit', { event_category: 'auth' });
      window.ym?.(12345678, 'reachGoal', 'phone_submit');
    } catch (error: any) {
      toast.error('Ошибка отправки кода');
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

      const { error: verifyErr } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: code,
        type: 'sms',
      });
      if (verifyErr) throw verifyErr;

      await supabase.auth.updateUser({ data: { phone: fullPhone } });
      toast.success('Успешно вошли');
      router.refresh();
      window.gtag?.('event', 'login_success', { event_category: 'auth' });
      window.ym?.(12345678, 'reachGoal', 'login_success');
    } catch (error: any) {
      toast.error('Ошибка подтверждения кода');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <main className="max-w-sm mx-auto py-10 px-4 text-center space-y-6" aria-label="Вход в личный кабинет">
        <Toaster position="top-center" />
        <h1 className="text-2xl font-bold tracking-tight">Вход в кабинет</h1>
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
                  <span className="pt-2">+7</span>
                  <IMaskInput
                    mask="(000) 000-00-00"
                    value={phone}
                    onAccept={(value: any) => setPhone(value)}
                    placeholder="(___) ___-__-__"
                    className={`border px-4 py-2 rounded w-full ${
                      phoneError ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-black`}
                    required
                    ref={phoneInputRef as any}
                    aria-label="Номер телефона"
                  />
                </div>
                {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}
                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={!agreed || isLoading}
                    className={`w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition ${
                      isLoading || !agreed ? 'opacity-50 cursor-not-allowed' : ''
                    } flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
                    aria-label="Отправить код"
                  >
                    {isLoading ? (
                      <>
                        <Image
                          src="/icons/spinner.svg"
                          alt="Загрузка"
                          width={20}
                          height={20}
                          className="animate-spin"
                        />
                        Загрузка...
                      </>
                    ) : (
                      'Отправить код'
                    )}
                  </button>
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
                  className="border px-4 py-2 rounded w-full text-center border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                  required
                  autoComplete="one-time-code"
                  aria-label="Код подтверждения"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  } flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
                  aria-label="Подтвердить код"
                >
                  {isLoading ? (
                    <>
                      <Image
                        src="/icons/spinner.svg"
                        alt="Загрузка"
                        width={20}
                        height={20}
                        className="animate-spin"
                      />
                      Проверка...
                    </>
                  ) : (
                    'Подтвердить'
                  )}
                </button>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="w-full text-sm text-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-black"
                    aria-label="Изменить номер телефона"
                  >
                    Изменить номер
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isLoading}
                    className={`w-full text-sm text-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-black ${
                      resendCooldown > 0 || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    aria-label="Отправить код повторно"
                  >
                    {resendCooldown > 0
                      ? `Отправить код повторно через ${resendCooldown} сек`
                      : 'Отправить код повторно'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6" aria-label="Личный кабинет">
      <Toaster position="top-center" />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Личный кабинет</h1>
        <button
          onClick={async () => {
            setIsLoading(true);
            await supabase.auth.signOut();
            router.refresh();
            toast.success('Вы вышли из аккаунта');
            setIsLoading(false);
            window.gtag?.('event', 'logout', { event_category: 'auth' });
            window.ym?.(12345678, 'reachGoal', 'logout');
          }}
          disabled={isLoading}
          className={`text-sm text-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          } flex items-center gap-2`}
          aria-label="Выйти из аккаунта"
        >
          {isLoading ? (
            <>
              <Image
                src="/icons/spinner.svg"
                alt="Загрузка"
                width={20}
                height={20}
                className="animate-spin"
              />
              Выход...
            </>
          ) : (
            'Выход'
          )}
        </button>
      </div>
      <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="pt-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center">
            <Image
              src="/icons/spinner.svg"
              alt="Загрузка"
              width={24}
              height={24}
              className="animate-spin text-gray-500"
            />
          </div>
        ) : (
          <>
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <PersonalForm onUpdate={fetchAccountData} />
                  {bonusData?.history && bonusData.history.length > 0 && (
                    <BonusHistory history={bonusData.history} />
                  )}
                </div>
                <BonusCard
                  balance={bonusData?.bonusBalance ?? 0}
                  level={bonusData?.level ?? '—'}
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