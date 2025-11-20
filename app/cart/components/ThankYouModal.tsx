'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import TrackedLink from '@components/TrackedLink';
import ScratchPrediction from './ScratchPrediction';
import AuthWithCall from '@components/AuthWithCall';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  orderNumber: number;
  trackingUrl?: string;
  isGuest?: boolean;
  guestPhone?: string;
}

export default function ThankYouModal({
  onClose,
  orderNumber,
  trackingUrl,
  isGuest = false,
  guestPhone = '',
}: Props) {
  const [timer, setTimer] = useState(15);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.ym === 'function') {
      window.ym(102737149, 'reachGoal', 'order_success');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onClose]);

  const copyTrackingUrl = () => {
    if (trackingUrl) {
      navigator.clipboard.writeText(trackingUrl).then(() => toast.success('Ссылка скопирована!'));
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } }, exit: { opacity: 0 } };
  const modalVariants = { hidden: { scale: 0.8, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 15 } } };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div className="relative w-full max-w-md bg-white border border-gray-300 rounded-lg p-6 shadow-sm overflow-y-auto max-h-screen" variants={modalVariants}>
          <motion.button onClick={onClose} className="absolute right-4 top-4" aria-label="Закрыть">
            <Image src="/icons/times.svg" alt="Закрыть" width={20} height={20} />
          </motion.button>

          <div className="flex justify-center mb-4">
            <Image src="/icons/thank-you.svg" alt="Спасибо" width={80} height={80} />
          </div>

          <h2 className="mb-3 text-center text-lg font-bold uppercase">Спасибо за заказ!</h2>
          <p className="mb-3 text-center text-sm text-gray-700">
            Ваш заказ <span className="font-bold text-base">№{orderNumber}</span> успешно оформлен.
          </p>

          {trackingUrl && (
            <div className="mb-4 text-center text-sm text-gray-700 flex items-center justify-center gap-2">
              <span>Отследить заказ:</span>
              <TrackedLink
                href={trackingUrl}
                ariaLabel="Отследить заказ"
                category="Cart"
                action="Track Order"
                label={`Order №${orderNumber}`}
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                здесь
              </TrackedLink>
              <button onClick={copyTrackingUrl} aria-label="Копировать">
                <Image src="/icons/copy.svg" alt="Копировать" width={16} height={16} />
              </button>
            </div>
          )}

          <p className="mb-4 text-center text-sm text-gray-700">Мы свяжемся с вами для подтверждения в ближайшее время.</p>

          {/* Блок для гостей */}
          {isGuest && (
            <motion.div
              className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-bold text-gray-900 mb-3">
                Хотите получить бонусы за этот заказ и видеть его в личном кабинете?
              </p>
              <p className="text-xs text-gray-600 mb-4">
                Это бесплатно и займёт 5 секунд — просто подтвердите номер звонком
              </p>

              {!showAuth ? (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                >
                  Подтвердить номер и получить бонусы 🎁
                </button>
              ) : (
                <div className="mt-4">
                  <AuthWithCall
                    onSuccess={async () => {
                      await fetch('/api/auth/link-orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: guestPhone }),
                      });
                      toast.success('Готово! Заказ привязан, бонусы начислены 🎉');
                      setShowAuth(false);
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}

          <ScratchPrediction />

          <div className="flex justify-center mt-6">
            <TrackedLink
              href="/"
              onClick={onClose}
              ariaLabel="На главную"
              category="Cart"
              action="Return to Home"
              label="Thank You Modal"
              className="w-full py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-900 text-center"
            >
              На главную
            </TrackedLink>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            Окно закроется через {timer} секунд...
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}