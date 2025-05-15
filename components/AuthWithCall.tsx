'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const WHATSAPP_LINK = 'https://wa.me/79886033821'; // Ваш номер WhatsApp

type Props = {
  onSuccess: (phone: string) => void;
};

export default function AuthWithCall({ onSuccess }: Props) {
  const [step, setStep] = useState<'phone' | 'call' | 'sms' | 'success' | 'ban'>('phone');
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

  // Обработка ввода номера телефона
  const handlePhoneInput = (value: string) => {
    setPhone(value);
  };

  // Таймер для блокировки
  const startBanTimer = () => {
    setBanTimer(600); // 10 минут
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

  // Таймер для звонка (5 минут)
  const startCallTimer = () => {
    setCallTimer(300); // 5 минут
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallTimer((t) => {
        if (t <= 1) {
          clearInterval(callTimerRef.current!);
          setStep('sms');
          setError('Время для звонка истекло. Получите код по SMS.');
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
      const clearPhone = phone.replace(/\D/g, '');
      console.log(`[${new Date().toISOString()}] Checking call status for checkId: ${checkId}, phone: ${clearPhone}`);
      const res = await fetch(`/api/auth/status?checkId=${checkId}&phone=${encodeURIComponent(clearPhone)}`);
      const data = await res.json();
      console.log(`[${new Date().toISOString()}] Check call status response:`, data);

      if (data.success && data.status === 'VERIFIED') {
        console.log('Call status verified, proceeding to success step');
        setStep('success');
        onSuccess(clearPhone);
        if (statusCheckRef.current) clearInterval(statusCheckRef.current);
      } else if (data.status === 'EXPIRED') {
        console.log('Call status expired, switching to SMS');
        setStep('sms');
        setError('Время для звонка истекло. Получите код по SMS.');
        if (statusCheckRef.current) clearInterval(statusCheckRef.current);
      } else if (data.error) {
        console.log('Error in call status:', data.error);
        setError(data.error);
      }
    } catch (err) {
      console.error('Ошибка проверки статуса звонка:', err);
      setError('Ошибка проверки статуса. Попробуйте запросить SMS-код.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Запуск периодической проверки статуса звонка
  useEffect(() => {
    if (step === 'call' && checkId && phone) {
      const initialDelay = setTimeout(() => {
        checkCallStatus();
        statusCheckRef.current = setInterval(checkCallStatus, 3000);
      }, 15000); // Задержка 15 секунд

      return () => {
        clearTimeout(initialDelay);
        if (statusCheckRef.current) clearInterval(statusCheckRef.current);
      };
    }
  }, [step, checkId, phone]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, []);

  // Отправка запроса на звонок
  const handleSendCall = async () => {
    setError('');
    setIsLoading(true);
    setCheckId(null);
    setCallPhonePretty(null);
    setCallPhoneRaw(null);

    // Очищаем номер от нецифровых символов
    const cleanPhone = phone.replace(/\D/g, '');
    console.log(`Cleaned phone for sending: ${cleanPhone}`);

    // Убедимся, что номер начинается с +7
    let formattedPhone = cleanPhone;
    if (!cleanPhone.startsWith('7')) {
      formattedPhone = '7' + cleanPhone;
    }
    formattedPhone = '+7' + formattedPhone.slice(1);

    console.log(`Formatted phone for API: ${formattedPhone}`);

    try {
      const res = await fetch('/api/auth/send-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const data = await res.json();
      console.log(`[${new Date().toISOString()}] Send call response:`, data);
      if (!data.success) {
        if (res.status === 429) {
          setStep('ban');
          startBanTimer();
        } else {
          setError(data.error || 'Не удалось инициировать звонок.');
        }
      } else {
        setCheckId(data.check_id);
        setCallPhonePretty(data.call_phone_pretty);
        setCallPhoneRaw(data.call_phone);
        setStep('call');
        startCallTimer();
      }
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    }
    setIsLoading(false);
  };

  // Отправка SMS
  const handleSendSms = async () => {
    setError('');
    setIsLoading(true);
    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (!cleanPhone.startsWith('7')) {
      formattedPhone = '7' + cleanPhone;
    }
    formattedPhone = '+7' + formattedPhone.slice(1);

    try {
      const res = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const data = await res.json();
      console.log('Send SMS response:', data);
      if (data.success) {
        setStep('sms');
      } else {
        if (res.status === 429) {
          setStep('ban');
          startBanTimer();
        } else {
          setError(data.error || 'Не удалось отправить SMS.');
        }
      }
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-xs mx-auto p-6 bg-white rounded-2xl shadow-xl flex flex-col gap-5 border border-black">
      <motion.h2
        className="text-xl font-bold text-black text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Вход по телефону
      </motion.h2>

      {step === 'phone' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label className="text-black block mb-1 text-sm">Ваш номер телефона:</label>
          <div className="flex gap-2 items-center">
            <span className="pt-2 text-gray-600">+7</span>
            <div className="relative flex-1">
              <input
                value={phone}
                onChange={(e) => handlePhoneInput(e.target.value)}
                placeholder="(xxx) xxx-xx-xx"
                className="w-full border border-black rounded-lg px-4 py-2 font-mono text-base outline-none focus:ring-2"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>
          <button
            className="w-full mt-4 py-2 rounded-xl border border-black bg-black text-white font-bold transition-all hover:bg-white hover:text-black hover:shadow"
            onClick={handleSendCall}
            disabled={isLoading || phone.replace(/\D/g, '').length !== 10}
          >
            {isLoading ? 'Отправка...' : 'Получить код по звонку'}
          </button>
          <p className="text-xs mt-2 text-gray-500 text-center">
            Позвоните на указанный номер для подтверждения.
          </p>
          {error && <div className="mt-2 text-center text-red-600">{error}</div>}
        </motion.div>
      )}

      {step === 'call' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label className="block text-black mb-1 text-sm">
            Позвоните на номер{' '}
            <a
              href={`tel:${callPhoneRaw}`}
              className="text-blue-600 underline hover:text-blue-800"
              aria-label={`Позвонить на номер ${callPhonePretty}`}
            >
              {callPhonePretty}
            </a>
          </label>
          <p className="text-sm text-gray-500 mb-4">
            После звонка авторизация завершится автоматически. Это может занять до 1 минуты. Если этого не произошло, попробуйте запросить SMS-код.
          </p>
          <button
            className="w-full mt-3 py-2 rounded-xl border border-black bg-white text-black font-bold transition-all hover:bg-black hover:text-white hover:shadow"
            onClick={handleSendSms}
            disabled={isLoading || isCheckingStatus}
          >
            Получить код по SMS
          </button>
          <p className="text-xs mt-2 text-gray-500 text-center">
            Время на звонок: {Math.floor(callTimer / 60)}:{('0' + (callTimer % 60)).slice(-2)}
          </p>
          {error && <div className="mt-2 text-center text-red-600">{error}</div>}
        </motion.div>
      )}

      {step === 'sms' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label className="block text-black mb-1 text-sm">
            Введите 4-значный код из SMS
          </label>
          <input
            className="w-full border border-black rounded-lg px-4 py-2 font-mono text-base outline-none focus:ring-2 tracking-widest text-center"
            inputMode="numeric"
            maxLength={4}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            autoFocus
            disabled={isLoading}
          />
          <button
            className="w-full mt-4 py-2 rounded-xl border border-black bg-black text-white font-bold transition-all hover:bg-white hover:text-black hover:shadow"
            onClick={handleSendSms}
            disabled={isLoading || phone.length !== 4}
          >
            {isLoading ? 'Проверка...' : 'Войти'}
          </button>
          {error && <div className="mt-2 text-center text-red-600">{error}</div>}
        </motion.div>
      )}

      {step === 'ban' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-center text-red-700 font-bold mb-2">
            Превышено число попыток
          </div>
          <div className="text-center mb-2">
            Повторная авторизация будет доступна через {Math.floor(banTimer / 60)}:{('0' + (banTimer % 60)).slice(-2)}
          </div>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block py-2 rounded-xl border border-green-500 bg-green-50 text-green-800 font-bold text-center transition-all hover:bg-green-500 hover:text-white"
          >
            Оформить заказ через WhatsApp
          </a>
        </motion.div>
      )}

      {step === 'success' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-center text-green-700 font-bold">Авторизация успешна!</div>
        </motion.div>
      )}
    </div>
  );
}
