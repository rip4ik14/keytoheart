// ✅ Путь: components/OrderStep.tsx
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
  const isActive = currentStep === step;
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive && !open) setOpen(true);
    if (!isActive && open) setOpen(false);
  }, [isActive, open]);

  return (
    <div
      className={`rounded-2xl border shadow-md overflow-hidden transition-colors ${
        isActive ? 'bg-white border-gray-200' : 'bg-white border-gray-100 opacity-90'
      }`}
      role="region"
      aria-labelledby={`order-step-${step}-title`}
    >
      <div
        className={`flex items-center px-5 py-4 cursor-pointer ${
          isActive ? 'text-black' : 'text-gray-400'
        }`}
        onClick={() => setOpen(!open)}
      >
        <div
          className={`w-8 h-8 rounded-full border flex items-center justify-center mr-3 text-sm font-bold ${
            isActive ? 'border-black' : 'border-gray-300'
          }`}
          aria-hidden="true"
        >
          {step}
        </div>
        <h2 id={`order-step-${step}-title`} className="text-lg font-semibold">
          {title}
        </h2>
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
                  onClick={() => {
                    onBack();
                    window.gtag?.('event', 'order_step_back', {
                      event_category: 'order',
                      step,
                    });
                    window.ym?.(96644553, 'reachGoal', 'order_step_back', { step });
                  }}
                  className="mr-auto border px-4 py-2 text-sm rounded hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-black"
                  aria-label="Вернуться к предыдущему шагу"
                >
                  Назад
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={() => {
                    onNext();
                    window.gtag?.('event', 'order_step_next', {
                      event_category: 'order',
                      step,
                    });
                    window.ym?.(96644553, 'reachGoal', 'order_step_next', { step });
                  }}
                  className="ml-auto bg-black text-white px-6 py-2 text-sm rounded hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-black"
                  aria-label="Перейти к следующему шагу"
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