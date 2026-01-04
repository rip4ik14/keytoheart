// ✅ Путь: app/cart/components/steps/Step5Payment.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import TrackedLink from '@components/TrackedLink';

interface Props {
  // ✅ оставляем для совместимости, но в этом шаге больше не используем
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

      {/* ✅ Вместо второй галочки - информер (необязательный) */}
      <motion.div
        className="rounded-xl border border-gray-200 bg-gray-50 p-3"
        initial="hidden"
        animate="visible"
        custom={2}
        variants={containerVariants}
      >
        <p className="text-[11px] leading-relaxed text-gray-600">
          Оформляя заказ, вы подтверждаете согласие с{' '}
          <TrackedLink
            href="/offer"
            ariaLabel="Публичная оферта"
            category="Cart"
            action="Open Offer"
            label="Step5 Offer"
            className="underline text-black hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            условиями публичной оферты
          </TrackedLink>{' '}
          и{' '}
          <TrackedLink
            href="/policy"
            ariaLabel="Политика конфиденциальности"
            category="Cart"
            action="Open Privacy"
            label="Step5 Privacy"
            className="underline text-black hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            политикой обработки персональных данных
          </TrackedLink>
          .
        </p>
      </motion.div>
    </div>
  );
}
