'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import TrackedLink from '@components/TrackedLink';

interface Props {
  onClose: () => void;
  orderId: string;
  trackingUrl?: string;
}

export default function ThankYouModal({ onClose, orderId, trackingUrl }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="thank-you-modal-title"
      >
        <motion.div
          className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={onClose}
            className="absolute right-4 top-3 text-gray-400 transition hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            aria-label="Закрыть модальное окно"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Image src="/icons/times.svg" alt="Закрыть" width={24} height={24} />
          </motion.button>

          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Image src="/thank-you.svg" alt="Спасибо за заказ" width={96} height={96} loading="lazy" />
          </motion.div>

          <h2 id="thank-you-modal-title" className="mb-4 text-center text-xl font-bold tracking-tight">
            Спасибо за заказ!
          </h2>
          <p className="mb-2 text-center text-sm text-gray-600">
            Ваш заказ #{orderId} успешно оформлен.
          </p>
          {trackingUrl && (
            <p className="mb-4 text-center text-sm text-gray-600">
              Отследить заказ:{' '}
              <TrackedLink
                href={trackingUrl}
                ariaLabel="Отследить заказ"
                category="Cart"
                action="Track Order"
                label={`Order #${orderId}`}
                className="text-black underline hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
                target="_blank"
                rel="noopener noreferrer"
              >
                здесь
              </TrackedLink>
            </p>
          )}
          <p className="mb-6 text-center text-sm text-gray-600">
            Мы свяжемся с вами для подтверждения в ближайшее время.
          </p>
          <TrackedLink
            href="/"
            onClick={onClose}
            className="block w-full rounded-lg bg-black py-2 text-sm text-white text-center transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            ariaLabel="Вернуться на главную страницу"
            category="Cart"
            action="Return to Home"
            label="Thank You Modal"
          >
            На главную
          </TrackedLink>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}