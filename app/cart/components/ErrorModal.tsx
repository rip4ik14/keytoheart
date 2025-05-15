// Путь: app/cart/components/ErrorModal.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Props {
  message: string;
  onRetry: () => Promise<void>;
  onClose: () => void;
}

export default function ErrorModal({ message, onRetry, onClose }: Props) {
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
    >
      <motion.div
        className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <h2 id="error-modal-title" className="mb-4 text-center text-xl font-bold tracking-tight">
          Ошибка
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600">{message}</p>
        <div className="flex gap-2">
          <motion.button
            onClick={onClose}
            className="flex-1 rounded-lg bg-white border border-gray-200 py-2 text-sm text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            aria-label="Закрыть модальное окно"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Закрыть
          </motion.button>
          <motion.button
            onClick={handleRetry}
            disabled={isRetrying}
            className={`flex-1 rounded-lg bg-black py-2 text-sm text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
              isRetrying ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Попробовать снова"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isRetrying ? (
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/icons/spinner.svg"
                  alt="Иконка загрузки"
                  width={20}
                  height={20}
                  className="animate-spin"
                />
                <span>Повтор...</span>
              </div>
            ) : (
              'Попробовать снова'
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}