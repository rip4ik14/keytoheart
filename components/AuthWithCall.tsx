'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabasePublic as supabase } from '@/lib/supabase/public';

const WHATSAPP_LINK = 'https://wa.me/79886033821';

type Props = {
  onSuccess: (phone: string) => void;
};

export default function AuthWithCall({ onSuccess }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'call' | 'success' | 'ban'>('phone');
  const [phone, setPhone] = useState('');
  const [checkId, setCheckId] = useState<string | null>(null);
  const [callPhonePretty, setCallPhonePretty] = useState<string | null>(null);
  const [callPhoneRaw, setCallPhoneRaw] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [banTimer, setBanTimer] = useState(0);
  const [callTimer, setCallTimer] = useState(300); // 5 минут
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'no-session') {
      setError('Пожалуйста, авторизуйтесь для доступа к личному кабинету.');
    } else if (errorParam === 'invalid-session') {
      setError('Сессия истекла. Пожалуйста, авторизуйтесь заново.');
    }
  }, [searchParams]);

  const formatPhone = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('8')) cleaned = '7' + cleaned.slice(1);
    if (!cleaned.startsWith('7')) cleaned = '7' + cleaned;
    return (
      '+7 ' +
      (cleaned.slice(1, 4) || '') +
      (cleaned.length > 1 ? ' ' : '') +
      (cleaned.slice(4, 7) || '') +
      (cleaned.length > 4 ? '-' : '') +
      (cleaned.slice(7, 9) || '') +
      (cleaned.length > 7 ? '-' : '') +
      (cleaned.slice(9, 11) || '')
    ).replace(/ $/, '');
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    if (v.length <= 11) setPhone(formatPhone(v));
  };

  const startBanTimer = () => {
    setBanTimer(600);
    if (timerRef.current) clearInterval(timerRef.current);
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

  const startCallTimer = () => {
    setCallTimer(300);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
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

  const checkCallStatus = async () => {
    if (!checkId || !phone) return;

    setIsCheckingStatus(true);
    try {
      const clearPhone = '+7' + phone.replace(/\D/g, '').slice(1, 11);
      const res = await fetch(`/api/auth/status?checkId=${checkId}&phone=${encodeURIComponent(clearPhone)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка проверки статуса');
      }

      if (data.success && data.status === 'VERIFIED') {
        setStep('success');
        onSuccess(clearPhone);
        if (statusCheckRef.current) clearInterval(statusCheckRef.current);
        window.gtag?.('event', 'auth_success', { event_category: 'auth', phone: clearPhone });
        window.ym?.(96644553, 'reachGoal', 'auth_success', { phone: clearPhone });

        // Отправляем кастомное событие после успешной авторизации
        window.dispatchEvent(new Event('authChange'));

        const redirectTo = searchParams.get('from') || '/account';
        router.push(redirectTo);
      } else if (data.status === 'EXPIRED') {
        setStep('phone');
        setError('Время для звонка истекло. Попробуйте снова.');
        if (statusCheckRef.current) clearInterval(statusCheckRef.current);
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

  useEffect(() => {
    if (step === 'call' && checkId && phone) {
      const initialDelay = setTimeout(() => {
        checkCallStatus();
        statusCheckRef.current = setInterval(checkCallStatus, 3000);
      }, 3000);

      return () => {
        clearTimeout(initialDelay);
        if (statusCheckRef.current) clearInterval(statusCheckRef.current);
      };
    }
  }, [step, checkId, phone, router]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, []);

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
          window.ym?.(96644553, 'reachGoal', 'auth_attempt_limit');
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
        window.ym?.(96644553, 'reachGoal', 'auth_call_initiated');
      }
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      className="w-full max-w-xs mx-auto p-6 bg-white rounded-2xl shadow-xl flex flex-col gap-5 border border-black"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2
        className="text-xl font-bold text-black text-center font-sans tracking-tight"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Вход по телефону
      </motion.h2>

      {step === 'phone' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <label htmlFor="phone-input" className="text-black block mb-1 text-sm font-sans">
            Ваш номер телефона:
          </label>
          <input
            id="phone-input"
            className="w-full border border-black rounded-lg px-4 py-2 font-sans text-base outline-none focus:ring-2 focus:ring-black"
            inputMode="tel"
            value={phone}
            placeholder="+7 (___) ___-__-__"
            onChange={handlePhoneInput}
            maxLength={16}
            disabled={isLoading}
            autoFocus
            aria-label="Введите номер телефона"
          />
          <motion.button
            className="w-full mt-4 py-2 rounded-xl border border-black bg-black text-white font-sans font-bold transition-all hover:bg-white hover:text-black hover:shadow disabled:opacity-50"
            onClick={handleSendCall}
            disabled={isLoading || phone.replace(/\D/g, '').length !== 11}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Получить код по звонку"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/icons/spinner.svg"
                  alt="Иконка загрузки"
                  width={20}
                  height={20}
                  className="animate-spin"
                />
                <span>Отправка...</span>
              </div>
            ) : (
              'Получить код по звонку'
            )}
          </motion.button>
          <p className="text-xs mt-2 text-gray-500 text-center font-sans">
            Позвоните на указанный номер для подтверждения.
          </p>
          <p className="text-xs mt-2 text-gray-500 text-center font-sans">
            Продолжая, вы соглашаетесь с{' '}
            <a href="/policy" className="underline hover:text-black">
              политикой конфиденциальности
            </a>.
          </p>
          {error && (
            <motion.div
              className="mt-2 text-center text-red-600 font-sans"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      )}

      {step === 'call' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <label className="block text-black mb-1 text-sm font-sans">
            Позвоните на номер{' '}
            <a
              href={`tel:${callPhoneRaw}`}
              className="text-black underline hover:text-gray-700"
              aria-label={`Позвонить на номер ${callPhonePretty}`}
            >
              {callPhonePretty}
            </a>
          </label>
          <p className="text-sm text-gray-500 mb-4 font-sans">
            После звонка авторизация завершится автоматически в течение 10-20 секунд.
          </p>
          <motion.div
            className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="absolute h-full bg-black"
              initial={{ width: '100%' }}
              animate={{ width: `${(callTimer / 300) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </motion.div>
          <p className="text-xs mt-2 text-gray-500 text-center font-sans">
            Время на звонок: {Math.floor(callTimer / 60)}:{('0' + (callTimer % 60)).slice(-2)}
          </p>
          {error && (
            <motion.div
              className="mt-2 text-center text-red-600 font-sans"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      )}

      {step === 'ban' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="text-center text-red-700 font-bold mb-2 font-sans">
            Превышено число попыток
          </div>
          <div className="text-center mb-2 font-sans">
            Повторная авторизация будет доступна через {Math.floor(banTimer / 60)}:{('0' + (banTimer % 60)).slice(-2)}
          </div>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block py-2 rounded-xl border border-black bg-black text-white font-sans font-bold text-center transition-all hover:bg-white hover:text-black"
            aria-label="Оформить заказ через WhatsApp"
          >
            Оформить заказ через WhatsApp
          </a>
        </motion.div>
      )}

      {step === 'success' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="text-center text-black font-bold font-sans">Авторизация успешна!</div>
        </motion.div>
      )}
    </motion.div>
  );
}