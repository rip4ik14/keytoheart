'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

import UiButton from '@/components/ui/UiButton';
import { Phone, ShieldCheck, Clock, AlertTriangle, MessageCircle } from 'lucide-react';

const WHATSAPP_LINK = 'https://wa.me/79886033821';

type Props = {
  onSuccess: (phone: string) => void;
};

// Маска телефона
function maskPhone(value: string) {
  let cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (!cleaned) return '';
  if (cleaned.startsWith('8')) cleaned = '7' + cleaned.slice(1);
  if (!cleaned.startsWith('7')) cleaned = '7' + cleaned;

  let out = '+7';
  if (cleaned.length > 1) out += ' ' + cleaned.slice(1, 4);
  if (cleaned.length > 4) out += ' ' + cleaned.slice(4, 7);
  if (cleaned.length > 7) out += '-' + cleaned.slice(7, 9);
  if (cleaned.length > 9) out += '-' + cleaned.slice(9, 11);
  return out;
}

function fmtTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${('0' + s).slice(-2)}`;
}

export default function AuthWithCall({ onSuccess }: Props) {
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'phone' | 'call' | 'success' | 'ban'>('phone');
  const [phone, setPhone] = useState('');
  const [checkId, setCheckId] = useState<string | null>(null);
  const [callPhonePretty, setCallPhonePretty] = useState<string | null>(null);
  const [callPhoneRaw, setCallPhoneRaw] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [banTimer, setBanTimer] = useState(0);
  const [callTimer, setCallTimer] = useState(300);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

  const phoneDigits = useMemo(() => phone.replace(/\D/g, ''), [phone]);
  const phoneIsValid = phoneDigits.length === 11;

  useEffect(() => {
    if (step === 'phone') {
      window.gtag?.('event', 'enter_phone', { event_category: 'auth' });
      if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'enter_phone');
    }
  }, [step]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'no-session') {
      setError('Пожалуйста, авторизуйтесь для доступа к личному кабинету.');
    } else if (errorParam === 'invalid-session') {
      setError('Сессия истекла. Пожалуйста, авторизуйтесь заново.');
    }
  }, [searchParams]);

  // Таймер блокировки
  const startBanTimer = () => {
    setBanTimer(600);
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setBanTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setStep('phone');
          setError('');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // Таймер на звонок
  const startCallTimer = () => {
    setCallTimer(300);
    callTimerRef.current && clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallTimer((t) => {
        if (t <= 1) {
          clearInterval(callTimerRef.current!);
          setStep('phone');
          setError('Время для звонка истекло. Попробуйте снова.');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // Проверка статуса звонка
  const checkCallStatus = async () => {
    if (!checkId || !phone) return;

    setIsCheckingStatus(true);
    try {
      const clearPhone = '+7' + phone.replace(/\D/g, '').slice(1, 11);
      const res = await fetch(`/api/auth/status?checkId=${checkId}&phone=${encodeURIComponent(clearPhone)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка проверки статуса');

      if (data.success && data.status === 'VERIFIED') {
        setStep('success');
        onSuccess(clearPhone);
        statusCheckRef.current && clearInterval(statusCheckRef.current);

        window.gtag?.('event', 'auth_success', { event_category: 'auth', phone: clearPhone });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'auth_success', { phone: clearPhone });
        window.dispatchEvent(new Event('authChange'));
      } else if (data.status === 'EXPIRED') {
        setStep('phone');
        setError('Время для звонка истекло. Попробуйте снова.');
        statusCheckRef.current && clearInterval(statusCheckRef.current);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Ошибка проверки статуса: ' + err.message);
      toast.error(err.message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Автопроверка статуса при звонке
  useEffect(() => {
    if (step === 'call' && checkId && phone) {
      const initial = setTimeout(() => {
        checkCallStatus();
        statusCheckRef.current = setInterval(checkCallStatus, 3000);
      }, 3000);

      return () => {
        clearTimeout(initial);
        statusCheckRef.current && clearInterval(statusCheckRef.current);
      };
    }
  }, [step, checkId, phone]);

  // Очистка таймеров на размонтирование
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      callTimerRef.current && clearInterval(callTimerRef.current);
      statusCheckRef.current && clearInterval(statusCheckRef.current);
    };
  }, []);

  // Запросить звонок
  const handleSendCall = async () => {
    setError('');
    setIsLoading(true);
    setCheckId(null);

    const clearPhone = '+7' + phone.replace(/\D/g, '').slice(1, 11);

    try {
      const res = await fetch('/api/auth/send-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clearPhone }),
      });

      const data = await res.json();

      if (!data.success) {
        if (res.status === 429) {
          setStep('ban');
          startBanTimer();

          window.gtag?.('event', 'auth_attempt_limit', { event_category: 'auth', phone: clearPhone });
          if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'auth_attempt_limit');
        } else {
          setError(data.error || 'Не удалось инициировать звонок.');
        }
      } else {
        setCheckId(data.check_id);
        setCallPhonePretty(data.call_phone_pretty);
        setCallPhoneRaw(data.call_phone);

        setStep('call');
        startCallTimer();

        window.gtag?.('event', 'auth_call_initiated', { event_category: 'auth', phone: clearPhone });
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'auth_call_initiated');
      }
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const cardCls =
    'w-full rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.08)]';

  return (
    <motion.div
      className={cardCls}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-black">
            Вход по звонку
          </h2>
          <p className="text-sm text-black/55 mt-1">
            Быстро и без паролей - подтвердите номер звонком
          </p>
        </div>

        <div className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/5 border border-black/10 text-black/70 inline-flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          защита
        </div>
      </div>

      <div className="mt-5">
        <AnimatePresence mode="wait">
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <label htmlFor="phone-input" className="text-sm font-semibold text-black/75">
                Телефон
              </label>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
                <input
                  id="phone-input"
                  type="tel"
                  className="
                    w-full rounded-2xl border border-black/10 bg-white
                    pl-10 pr-4 py-3 text-sm
                    outline-none
                    focus:ring-2 focus:ring-black/20
                    placeholder-black/35
                  "
                  inputMode="tel"
                  placeholder="+7 ___ ___-__-__"
                  autoFocus
                  aria-label="Введите номер телефона"
                  maxLength={17}
                  value={phone}
                  disabled={isLoading}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                />
              </div>

              <UiButton
                type="button"
                variant="brand"
                onClick={handleSendCall}
                disabled={isLoading || !phoneIsValid}
                className="w-full rounded-2xl py-3"
              >
                {isLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Image
                      src="/icons/spinner.svg"
                      alt="Загрузка"
                      width={18}
                      height={18}
                      className="animate-spin"
                    />
                    Отправка...
                  </span>
                ) : (
                  'Получить код по звонку'
                )}
              </UiButton>

              <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3">
                <div className="text-sm font-semibold text-black/75">Как это работает</div>
                <ul className="mt-2 space-y-1 text-sm text-black/55">
                  <li>- мы покажем номер, на который нужно позвонить</li>
                  <li>- вы звоните, и вход завершается автоматически</li>
                </ul>
              </div>

              <p className="text-xs text-black/45 leading-relaxed">
                Продолжая, вы соглашаетесь с{' '}
                <a href="/policy" className="underline hover:text-black">
                  политикой конфиденциальности
                </a>
                .
              </p>

              {error && (
                <div className="rounded-2xl border border-rose-600/20 bg-rose-600/5 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {step === 'call' && (
            <motion.div
              key="call"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-black/80">
                      Позвоните на номер
                    </div>

                    <a
                      href={`tel:${callPhoneRaw || ''}`}
                      className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-black underline hover:no-underline"
                      aria-label={`Позвонить на номер ${callPhonePretty || ''}`}
                    >
                      {callPhonePretty || '...'}
                    </a>

                    <p className="mt-2 text-sm text-black/55">
                      После звонка вход завершится автоматически в течение 10-20 секунд.
                    </p>
                  </div>

                  <div className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white border border-black/10 text-black/70 inline-flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {fmtTimer(callTimer)}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="relative w-full h-2 bg-black/10 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-black"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(callTimer / 300) * 100}%` }}
                      transition={{ duration: 1, ease: 'linear' }}
                    />
                  </div>

                  <div className="mt-2 text-xs text-black/45 flex items-center justify-between">
                    <span>Время на звонок</span>
                    <span className="inline-flex items-center gap-2">
                      {isCheckingStatus ? (
                        <>
                          <Image
                            src="/icons/spinner.svg"
                            alt="Проверка"
                            width={14}
                            height={14}
                            className="animate-spin"
                          />
                          проверяем...
                        </>
                      ) : (
                        'ожидаем звонок'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-600/20 bg-rose-600/5 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {step === 'ban' && (
            <motion.div
              key="ban"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-3xl border border-rose-600/20 bg-rose-600/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-700 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-rose-800">
                      Превышено число попыток
                    </div>
                    <div className="text-sm text-rose-800/80 mt-1">
                      Повторная авторизация будет доступна через {fmtTimer(banTimer)}
                    </div>
                  </div>
                </div>
              </div>

              <UiButton variant="brand" asChild className="w-full rounded-2xl py-3">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Оформить заказ через WhatsApp"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Оформить заказ через WhatsApp
                  </span>
                </a>
              </UiButton>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-5 text-center">
                <div className="text-lg font-semibold text-black">Авторизация успешна</div>
                <div className="text-sm text-black/55 mt-1">Открываем личный кабинет...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
