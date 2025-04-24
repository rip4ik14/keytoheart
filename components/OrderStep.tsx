// components/OrderStep.tsx
'use client';

import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderStepProps {
  step: number;
  currentStep: number;
  title: string;
  children: ReactNode;
  onNext?: () => void;
  onBack?: () => void;
}

const variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1 },
};

export default function OrderStep({
  step,
  currentStep,
  title,
  children,
  onNext,
  onBack,
}: OrderStepProps) {
  // ✅ меняем тут
  const isActive = currentStep === step;
  
  const [open, setOpen] = useState(isActive);

  // Синхронизируем open при изменении currentStep
  useEffect(() => {
    if (isActive && !open) setOpen(true);
    if (!isActive && open) setOpen(false);
  }, [isActive, open]);

  return (
    <div
      className={`rounded-2xl border shadow-md overflow-hidden transition-colors
        ${isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-90'}`}
    >
      <div
        className={`flex items-center px-5 py-4 cursor-pointer
          ${isActive ? 'text-black' : 'text-gray-400'}`}
        onClick={() => {
          // Если хочешь, чтобы пользователь мог заново раскрывать прошедшие шаги —
          // оставляем условие if (true). Или, наоборот, отключаем кликабельность:
          if (true) setOpen(!open);
        }}
      >
        <div
          className={`w-8 h-8 rounded-full border flex items-center justify-center mr-3 text-sm font-bold
            ${isActive ? 'border-black' : 'border-gray-300'}`}
        >
          {step}
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="px-6 pb-6"
            key="content"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
          >
            {children}
            <div className="flex mt-6">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mr-auto border px-4 py-2 text-sm rounded hover:bg-gray-100 transition"
                >
                  Назад
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="ml-auto bg-black text-white px-6 py-2 text-sm rounded hover:bg-gray-800 transition"
                >
                  Продолжить
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
