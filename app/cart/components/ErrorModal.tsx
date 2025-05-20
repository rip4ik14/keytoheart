// ✅ Путь: app/cart/components/ErrorModal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Props {
  message: string;
  onRetry: () => Promise<void>;
  onClose: () => void;
}

export default function ErrorModal({ message, onRetry, onClose }: Props) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="mb-4 text-center text-xl font-semibold text-gray-900">Ошибка</h2>
          <p className="mb-6 text-center text-sm text-gray-600">{message}</p>
          <div className="flex gap-3">
            <motion.button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Закрыть
            </motion.button>
            <motion.button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`flex-1 py-3 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-black ${
                isRetrying ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
              }`}
              whileHover={{ scale: isRetrying ? 1 : 1.02 }}
              whileTap={{ scale: isRetrying ? 1 : 0.98 }}
            >
              {isRetrying ? 'Повтор...' : 'Попробовать снова'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
