'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import TrackedLink from '@components/TrackedLink';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  orderNumber: number;
  trackingUrl?: string;
}

export default function ThankYouModal({ onClose, orderNumber, trackingUrl }: Props) {
  const [timer, setTimer] = useState(15);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const modalVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 200, damping: 15 },
    },
    exit: { scale: 0.8, opacity: 0, transition: { duration: 0.3 } },
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 150, damping: 10, delay: 0.2 },
    },
  };

  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, delay: 0.4 } },
  };

  const buttonVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, delay: 0.6 } },
  };

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [onClose]);

  const copyTrackingUrl = () => {
    if (trackingUrl) {
      navigator.clipboard.writeText(trackingUrl).then(() => {
        toast.success('Ссылка скопирована!');
      }).catch(() => {
        toast.error('Не удалось скопировать ссылку');
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-labelledby="thank-you-modal-title"
      >
        <motion.div
          className="relative w-full max-w-md bg-white border border-gray-300 rounded-lg p-4 sm:p-6 shadow-sm"
          variants={modalVariants}
        >
          <motion.button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-black p-1"
            aria-label="Закрыть модальное окно"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Image src="/icons/times.svg" alt="Закрыть" width={20} height={20} />
          </motion.button>

          <motion.div className="flex justify-center mb-4" variants={iconVariants}>
            <Image
              src="/icons/thank-you.svg"
              alt="Спасибо за заказ"
              width={80}
              height={80}
              loading="lazy"
            />
          </motion.div>

          <motion.h2
            id="thank-you-modal-title"
            className="mb-3 text-center text-lg font-bold uppercase text-gray-900"
            variants={textVariants}
          >
            Спасибо за заказ!
          </motion.h2>

          <motion.p
            className="mb-3 text-center text-sm text-gray-700"
            variants={textVariants}
          >
            Ваш заказ <span className="font-bold text-base">№{orderNumber}</span> успешно оформлен.
          </motion.p>

          {trackingUrl && (
            <motion.div
              className="mb-4 text-center text-sm text-gray-700 flex items-center justify-center gap-2"
              variants={textVariants}
            >
              <span>Отследить заказ:</span>
              <TrackedLink
                href={trackingUrl}
                ariaLabel="Отследить заказ"
                category="Cart"
                action="Track Order"
                label={`Order №${orderNumber}`}
                className="text-gray-900 underline hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
                target="_blank"
                rel="noopener noreferrer"
              >
                здесь
              </TrackedLink>
              <motion.button
                onClick={copyTrackingUrl}
                className="text-gray-900 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-black p-1"
                aria-label="Копировать ссылку для отслеживания"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Image src="/icons/copy.svg" alt="Копировать" width={16} height={16} />
              </motion.button>
            </motion.div>
          )}

          <motion.p
            className="mb-4 text-center text-sm text-gray-700"
            variants={textVariants}
          >
            Мы свяжемся с вами для подтверждения в ближайшее время.
          </motion.p>

          <motion.div className="flex justify-center" variants={buttonVariants}>
            <TrackedLink
              href="/"
              onClick={onClose}
              className="w-full py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-center"
              ariaLabel="Вернуться на главную страницу"
              category="Cart"
              action="Return to Home"
              label="Thank You Modal"
            >
              На главную
            </TrackedLink>
          </motion.div>

          <motion.div
            className="mt-4 text-center text-xs text-gray-500"
            variants={textVariants}
          >
            Окно закроется через {timer} секунд...
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}