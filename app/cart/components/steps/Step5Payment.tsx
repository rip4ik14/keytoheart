'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: { delay: i * 0.08, duration: 0.25 },
  }),
};

export default function Step5Payment() {
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
        className="text-xs text-gray-500 leading-relaxed"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={containerVariants}
      >
        После оформления заказа мы свяжемся с вами, уточним детали и отправим ссылку на оплату или реквизиты удобным
        способом.
      </motion.p>
    </div>
  );
}
