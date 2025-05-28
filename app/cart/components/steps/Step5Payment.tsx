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
        <span className="text-sm text-gray-700">Оплата после подтверждения заказа</span>
      </motion.div>

      <motion.label
        className="flex items-start gap-2"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={containerVariants}
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
          required
          aria-label="Согласен с политикой"
        />
        <span className="text-sm text-gray-700">
          Я согласен с{' '}
          <TrackedLink
            href="/policy"
            ariaLabel="Политика конфиденциальности"
            category="Cart"
            action="Open Privacy"
            label="Step5 Privacy"
            className="underline text-black hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            политикой конфиденциальности
          </TrackedLink>
        </span>
      </motion.label>
    </div>
  );
}