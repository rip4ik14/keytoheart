// ✅ Путь: components/OrderStep.tsx
'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import UiButton from '@/components/ui/UiButton';

interface OrderStepProps {
  step: number;
  currentStep: number;
  title: string;
  children: ReactNode;

  // IMPORTANT: now returns success flag
  onNext?: () => boolean | Promise<boolean>;
  onBack?: () => void | Promise<void>;

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
    if (isActive) setOpen(true);
    else setOpen(false);
  }, [isActive]);

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
              <div className="mt-3 text-[12px] leading-snug text-[#9b9b9b]">{summary}</div>
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
                  <UiButton
                    type="button"
                    onClick={async () => {
                      if (isSubmitting) return;

                      await onBack?.();
                      window.gtag?.('event', 'order_step_back', {
                        event_category: 'order',
                        step,
                      });
                      if (YM_ID) {
                        callYm(YM_ID, 'reachGoal', 'order_step_back', { step });
                      }
                    }}
                    variant="brandOutline"
                    disabled={isSubmitting}
                    className="w-full rounded-[18px] py-4 text-xs normal-case active:scale-[0.99]"
                    aria-label="Вернуться к предыдущему шагу"
                  >
                    НАЗАД
                  </UiButton>
                )}

                {onNext && (
                  <UiButton
                    type="button"
                    onClick={async () => {
                      if (isNextDisabled || isSubmitting) return;

                      const ok = await onNext();
                      if (!ok) return;

                      window.gtag?.('event', 'order_step_next', {
                        event_category: 'order',
                        step,
                      });
                      if (YM_ID) {
                        callYm(YM_ID, 'reachGoal', 'order_step_next', { step });
                      }
                    }}
                    variant="brand"
                    className="w-full rounded-[18px] py-4 text-xs normal-case active:scale-[0.99]"
                    aria-label="Перейти к следующему шагу"
                    disabled={isNextDisabled || isSubmitting}
                  >
                    {isSubmitting ? 'Отправляем...' : 'ПРОДОЛЖИТЬ'}
                  </UiButton>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
