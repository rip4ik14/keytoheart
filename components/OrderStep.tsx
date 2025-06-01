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
  isNextDisabled?: boolean;
}

const variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: { duration: 0.3 } },
};

export default function OrderStep({
  step,
  currentStep,
  title,
  children,
  onNext,
  onBack,
  isNextDisabled = false,
}: OrderStepProps) {
  const isActive = currentStep === step;
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive && !open) setOpen(true);
    if (!isActive && open) setOpen(false);
  }, [isActive, open]);

  const buttonStyle = `
    border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
    transition-all duration-200 shadow-sm
    hover:bg-[#535353] hover:text-white active:scale-[.96]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]
  `;

  return (
    <div
      className={`
        rounded-lg border border-gray-200 shadow-sm
        overflow-hidden transition-colors
        ${isActive ? 'bg-white' : 'bg-gray-50 opacity-90'}
      `}
      role="region"
      aria-labelledby={`order-step-${step}-title`}
    >
      <div
        className={`
          flex items-center px-4 py-3 sm:px-5 sm:py-4 cursor-pointer
          ${isActive ? 'text-black' : 'text-gray-400'}
        `}
        onClick={() => setOpen(!open)}
      >
        <div
          className={`
            w-8 h-8 rounded-full border flex items-center justify-center mr-2 sm:mr-3
            text-sm font-bold
            ${isActive ? 'border-black' : 'border-gray-300'}
          `}
          aria-hidden="true"
        >
          {step}
        </div>
        <h2 id={`order-step-${step}-title`} className="text-base sm:text-lg font-semibold">
          {title}
        </h2>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="px-4 pb-4 sm:px-6 sm:pb-6"
            key="content"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
          >
            {children}
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              {onBack && (
                <button
                  type="button"
                  onClick={() => {
                    onBack();
                    window.gtag?.('event', 'order_step_back', {
                      event_category: 'order',
                      step,
                    });
                    window.ym?.(12345678, 'reachGoal', 'order_step_back', { step });
                  }}
                  className={`${buttonStyle} flex-1 bg-gray-200 text-[#535353] hover:bg-gray-300 hover:text-[#535353]`}
                  aria-label="Вернуться к предыдущему шагу"
                >
                  Назад
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={() => {
                    if (isNextDisabled) return;
                    onNext();
                    window.gtag?.('event', 'order_step_next', {
                      event_category: 'order',
                      step,
                    });
                    window.ym?.(12345678, 'reachGoal', 'order_step_next', { step });
                  }}
                  className={`${buttonStyle} flex-1 bg-white text-[#535353] ${
                    isNextDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label="Перейти к следующему шагу"
                  disabled={isNextDisabled}
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