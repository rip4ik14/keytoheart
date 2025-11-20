// ✅ Путь: app/cart/components/steps/Step5Payment.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import TrackedLink from '@components/TrackedLink';

interface Props {
  agreed: boolean;
  setAgreed: (a: boolean) => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export default function Step5Payment({ agreed, setAgreed }: Props) {
  return (
    <div className="space-y-4">
      <motion.div
        className="flex items-center gap-2"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={containerVariants}
      >
        <Image src="/icons/credit-card.svg" alt="Оплата" width={16} height={16} loading="lazy" />
        <span className="text-base sm:text-sm text-gray-700">
          Оплата после подтверждения заказа менеджером
        </span>
      </motion.div>

      <motion.p
        className="text-xs text-gray-500"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={containerVariants}
      >
        После оформления заказа мы свяжемся с вами, уточним детали и отправим ссылку на оплату или
        реквизиты удобным способом.
      </motion.p>

      <motion.label
        className="flex items-start gap-2"
        initial="hidden"
        animate="visible"
        custom={2}
        variants={containerVariants}
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
          required
          aria-label="Согласен с политикой конфиденциальности"
        />
        <span className="text-base sm:text-sm text-gray-700 leading-snug">
          Я согласен с{' '}
          <TrackedLink
            href="/policy"
            ariaLabel="Политика конфиденциальности"
            category="Cart"
            action="Open Privacy"
            label="Step5 Privacy"
            className="underline text-black hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            политикой конфиденциальности и обработкой персональных данных
          </TrackedLink>
          , а также подтверждаю корректность указанных данных для оформления заказа.
        </span>
      </motion.label>
    </div>
  );
}
