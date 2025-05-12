'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { IMaskInput } from 'react-imask';
import { phoneMask } from '@utils/phoneMask';

interface Props {
  onAuthSuccess: (phone: string, profile: { name: string }, bonusBalance: number) => void;
}

export default function AuthWithCall({ onAuthSuccess }: Props) {
  const [phone, setPhone] = useState<string>('');
  const [isCallSent, setIsCallSent] = useState<boolean>(false);
  const [isSendingCall, setIsSendingCall] = useState<boolean>(false);
  const [isVerifyingCall, setIsVerifyingCall] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [phoneError, setPhoneError] = useState<string>('');
  const [callPhone, setCallPhone] = useState<string>('');
  const [checkId, setCheckId] = useState<string>('');

  const handlePhoneChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    const formattedPhone = phoneMask(cleanValue);
    setPhone(formattedPhone);
    setPhoneError('');
    setIsCallSent(false);
    setCallPhone('');
    setCheckId('');
  };

  const sendCall = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setPhoneError('Введите корректный номер телефона (10 цифр)');
      return;
    }
    setPhoneError('');
    setIsSendingCall(true);
    try {
      const response = await fetch('/api/auth/send-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+7${cleanPhone}` }),
      });
      const result = await response.json();
      if (result.success) {
        setIsCallSent(true);
        setCallPhone(result.callPhone);
        setCheckId(result.checkId);
        setResendCooldown(90);
        toast.success(`Позвоните на номер ${result.callPhone} для авторизации.`);
        window.gtag?.('event', 'send_call_request', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'send_call_request');
      } else {
        setPhoneError(result.error || 'Не удалось инициировать звонок.');
        toast.error(result.error || 'Не удалось инициировать звонок.');
      }
    } catch (error) {
      setPhoneError('Не удалось инициировать звонок.');
      toast.error('Не удалось инициировать звонок.');
    } finally {
      setIsSendingCall(false);
    }
  };

  const resendCall = async () => {
    if (resendCooldown > 0) return;
    setIsSendingCall(true);
    setResendCooldown(90);
    try {
      const response = await fetch('/api/auth/send-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+7${phone.replace(/\D/g, '')}` }),
      });
      const result = await response.json();
      if (result.success) {
        setIsCallSent(true);
        setCallPhone(result.callPhone);
        setCheckId(result.checkId);
        toast.success(`Позвоните на номер ${result.callPhone} для авторизации.`);
        window.gtag?.('event', 'resend_call_request', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'resend_call_request');
      } else {
        setPhoneError(result.error || 'Не удалось инициировать звонок.');
        toast.error(result.error || 'Не удалось инициировать звонок.');
      }
    } catch (error) {
      setPhoneError('Не удалось инициировать звонок.');
      toast.error('Не удалось инициировать звонок.');
    } finally {
      setIsSendingCall(false);
    }
  };

  const verifyCall = async () => {
    setIsVerifyingCall(true);
    try {
      const response = await fetch('/api/auth/verify-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+7${phone.replace(/\D/g, '')}`, checkId }),
      });
      const result = await response.json();
      if (result.success) {
        onAuthSuccess(`+7${phone.replace(/\D/g, '')}`, { name: result.name || '' }, result.bonusBalance || 0);
        toast.success('Авторизация успешна!');
        window.gtag?.('event', 'verify_call', { event_category: 'auth' });
        window.ym?.(12345678, 'reachGoal', 'verify_call');
      } else {
        toast.error(result.error || 'Звонок ещё не выполнен. Пожалуйста, позвоните на указанный номер.');
      }
    } catch (error) {
      toast.error('Ошибка проверки звонка.');
    } finally {
      setIsVerifyingCall(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  return (
    <div className="space-y-4">
      <motion.div className="mb-2">
        <label htmlFor="phone" className="text-sm font-medium mb-1 block text-gray-700">
          Телефон
        </label>
        <div className="flex gap-2 items-center">
          <span className="pt-2 text-gray-600">+7</span>
          <div className="relative flex-1">
            <motion.div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              whileHover={{ scale: 1.1 }}
            >
              <Image src="/icons/phone.svg" alt="Телефон" width={16} height={16} />
            </motion.div>
            <IMaskInput
              id="phone"
              mask="(000) 000-00-00"
              name="phone"
              value={phone}
              onAccept={handlePhoneChange}
              placeholder="(___) ___-__-__"
              className={`w-full rounded-lg border border-gray-300 p-2 pl-10 ${
                phoneError ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
              disabled={isCallSent}
              aria-label="Введите номер телефона"
              aria-invalid={phoneError ? 'true' : 'false'}
            />
          </div>
        </div>
        {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
      </motion.div>
      <AnimatePresence>
        {!isCallSent ? (
          <motion.button
            onClick={sendCall}
            disabled={isSendingCall}
            className={`w-full rounded-lg bg-black py-2 text-white hover:bg-gray-800 flex items-center justify-center gap-2 transition-all duration-300 ${
              isSendingCall ? 'opacity-50 cursor-not-allowed' : ''
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
            aria-label="Получить номер для звонка"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {isSendingCall ? (
              <>
                <Image src="/icons/spinner.svg" alt="Загрузка" width={20} height={20} className="animate-spin" />
                Запрашиваем номер...
              </>
            ) : (
              'Получить номер для звонка'
            )}
          </motion.button>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.div className="mb-2">
              <p className="text-sm font-medium mb-1 text-gray-700">
                Позвоните на номер: <strong>{callPhone}</strong>
              </p>
              <p className="text-xs text-gray-500">
                У вас есть 5 минут, чтобы совершить звонок. Звонок бесплатный.
              </p>
            </motion.div>
            <motion.button
              onClick={verifyCall}
              disabled={isVerifyingCall}
              className={`w-full rounded-lg bg-black py-2 text-white hover:bg-gray-800 flex items-center justify-center gap-2 transition-all duration-300 ${
                isVerifyingCall ? 'opacity-50 cursor-not-allowed' : ''
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
              aria-label="Проверить статус звонка"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isVerifyingCall ? (
                <>
                  <Image src="/icons/spinner.svg" alt="Загрузка" width={20} height={20} className="animate-spin" />
                  Проверка...
                </>
              ) : (
                'Проверить'
              )}
            </motion.button>
            <motion.div className="flex flex-col gap-2">
              <motion.button
                type="button"
                onClick={() => {
                  setIsCallSent(false);
                  setCallPhone('');
                  setCheckId('');
                }}
                className="w-full text-sm text-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-black"
                aria-label="Изменить номер телефона"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Изменить номер
              </motion.button>
              <motion.button
                type="button"
                onClick={resendCall}
                disabled={resendCooldown > 0 || isSendingCall}
                className={`w-full text-sm text-gray-500 hover:underline focus:outline-none focus:ring-2 focus:ring-black ${
                  resendCooldown > 0 || isSendingCall ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label="Повторить звонок"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {resendCooldown > 0
                  ? `Повторить запрос через ${resendCooldown} сек`
                  : 'Повторить запрос'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}