'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import TrackedLink from '@components/TrackedLink';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  orderId: string;
  trackingUrl?: string;
}

export default function ThankYouModal({ onClose, orderId, trackingUrl }: Props) {
  const [timer, setTimer] = useState(15); // 15 секунд для авто-закрытия

  // Варианты анимации для контейнера
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  // Варианты анимации для содержимого модального окна
  const modalVariants = {
    hidden: { scale: 0.8, opacity: 0, rotate: -5 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 15,
        mass: 0.5,
      },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      rotate: 5,
      transition: { duration: 0.3 },
    },
  };

  // Варианты анимации для иконки
  const iconVariants = {
    hidden: { scale: 0, opacity: 0, rotate: -180 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 10,
        delay: 0.2,
      },
    },
  };

  // Варианты анимации для текста
  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.4,
      },
    },
  };

  // Варианты анимации для кнопок
  const buttonVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.6,
      },
    },
  };

  // Эффект для автоматического закрытия через 15 секунд
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

  // Функция копирования trackingUrl
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black/70 to-black/50 p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-labelledby="thank-you-modal-title"
      >
        <motion.div
          className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100/50 backdrop-blur-sm"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Кнопка закрытия с анимацией */}
          <motion.button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 transition-all hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded-full p-1"
            aria-label="Закрыть модальное окно"
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <Image src="/icons/times.svg" alt="Закрыть" width={24} height={24} />
          </motion.button>

          {/* Иконка с анимацией */}
          <motion.div
            className="flex justify-center mb-4"
            variants={iconVariants}
            initial="hidden"
            animate="visible"
          >
            <Image
              src="/thank-you.svg"
              alt="Спасибо за заказ"
              width={96}
              height={96}
              loading="lazy"
              className="drop-shadow-md"
            />
          </motion.div>

          {/* Заголовок */}
          <motion.h2
            id="thank-you-modal-title"
            className="mb-3 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900"
            variants={textVariants}
            initial="hidden"
            animate="visible"
          >
            Спасибо за заказ! 🎉
          </motion.h2>

          {/* Сообщение об успешном заказе */}
          <motion.p
            className="mb-3 text-center text-sm sm:text-base text-gray-600 leading-relaxed"
            variants={textVariants}
            initial="hidden"
            animate="visible"
          >
            Ваш заказ <span className="font-semibold text-gray-800">#{orderId}</span> успешно оформлен.
          </motion.p>

          {/* Ссылка для отслеживания и копирование */}
          {trackingUrl && (
            <motion.div
              className="mb-4 text-center text-sm sm:text-base text-gray-600 flex items-center justify-center gap-2"
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              <span>Отследить заказ:</span>
              <TrackedLink
                href={trackingUrl}
                ariaLabel="Отследить заказ"
                category="Cart"
                action="Track Order"
                label={`Order #${orderId}`}
                className="text-indigo-600 underline hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                здесь
              </TrackedLink>
              <motion.button
                onClick={copyTrackingUrl}
                className="text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 p-1"
                aria-label="Копировать ссылку для отслеживания"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Image
                  src="/icons/copy.svg"
                  alt="Копировать"
                  width={16}
                  height={16}
                  loading="lazy"
                />
              </motion.button>
            </motion.div>
          )}

          {/* Сообщение о подтверждении */}
          <motion.p
            className="mb-6 text-center text-sm sm:text-base text-gray-600 leading-relaxed"
            variants={textVariants}
            initial="hidden"
            animate="visible"
          >
            Мы свяжемся с вами для подтверждения в ближайшее время.
          </motion.p>

          {/* Кнопка "На главную" */}
          <motion.div
            className="flex justify-center"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
          >
            <TrackedLink
              href="/"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base font-semibold text-center shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-300"
              ariaLabel="Вернуться на главную страницу"
              category="Cart"
              action="Return to Home"
              label="Thank You Modal"
            >
              На главную
            </TrackedLink>
          </motion.div>

          {/* Таймер автоматического закрытия */}
          <motion.div
            className="mt-4 text-center text-xs text-gray-400"
            variants={textVariants}
            initial="hidden"
            animate="visible"
          >
            Окно закроется через {timer} секунд...
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}