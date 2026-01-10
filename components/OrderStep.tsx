'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderStepProps {
  step: number;
  currentStep: number;
  title: string;
  children: ReactNode;

  onNext?: () => void | Promise<void>;
  onBack?: () => void;

  isNextDisabled?: boolean;
  isSubmitting?: boolean;

  onActivate?: () => void;

  summary?: ReactNode;
  showEdit?: boolean;
}

const variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: { duration: 0.22 } },
};

export default function OrderStep({
  step,
  currentStep,
  title,
  children,
  onNext,
  onBack,
  isNextDisabled = false,
  isSubmitting = false,
  onActivate,
  summary,
  showEdit = false,
}: OrderStepProps) {
  const isActive = currentStep === step;
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive && !open) setOpen(true);
    if (!isActive && open) setOpen(false);
  }, [isActive, open]);

  const primaryBtn =
    'w-full rounded-[18px] bg-[#4b4b4b] text-white font-bold uppercase tracking-tight text-xs py-4 shadow-sm active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed';
  const secondaryBtn =
    'w-full rounded-[18px] bg-white text-[#4b4b4b] font-bold uppercase tracking-tight text-xs py-4 border border-[#bdbdbd] shadow-sm active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <div
      className="border border-[#bdbdbd] rounded-[26px] bg-white overflow-hidden"
      role="region"
      aria-labelledby={`order-step-${step}-title`}
    >
      <button
        type="button"
        className="w-full text-left px-4 py-4"
        onClick={() => {
          if (!isActive) {
            onActivate?.();
            return;
          }
          setOpen((v) => !v);
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 ${
              isActive ? 'border-black text-black' : 'border-[#bdbdbd] text-[#6f6f6f]'
            }`}
            aria-hidden="true"
          >
            {step}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2
                id={`order-step-${step}-title`}
                className={`font-semibold text-[15px] leading-tight ${
                  isActive ? 'text-black' : 'text-[#6f6f6f]'
                }`}
              >
                {title}
              </h2>

              {!isActive && showEdit && (
                <span className="text-[11px] font-bold uppercase tracking-tight text-[#6f6f6f]">
                  Изменить
                </span>
              )}
            </div>

            {!isActive && summary && (
              <div className="mt-3 text-[12px] leading-snug text-[#9b9b9b]">
                {summary}
              </div>
            )}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="px-4 pb-5"
          >
            <div className="pt-1">{children}</div>

            {(onBack || onNext) && (
              <div className="mt-5 flex gap-3">
                {onBack && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isSubmitting) return;

                      onBack?.();
                      window.gtag?.('event', 'order_step_back', {
                        event_category: 'order',
                        step,
                      });
                      if (YM_ID) {
                        callYm(YM_ID, 'reachGoal', 'order_step_back', { step });
                      }
                    }}
                    className={secondaryBtn}
                    disabled={isSubmitting}
                    aria-label="Вернуться к предыдущему шагу"
                  >
                    Назад
                  </button>
                )}

                {onNext && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (isNextDisabled || isSubmitting) return;

                      await onNext();
                      window.gtag?.('event', 'order_step_next', {
                        event_category: 'order',
                        step,
                      });
                      if (YM_ID) {
                        callYm(YM_ID, 'reachGoal', 'order_step_next', { step });
                      }
                    }}
                    className={primaryBtn}
                    aria-label="Перейти к следующему шагу"
                    disabled={isNextDisabled || isSubmitting}
                  >
                    {isSubmitting ? 'Отправляем...' : 'Продолжить'}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
