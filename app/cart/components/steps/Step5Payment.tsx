'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import TrackedLink from '@components/TrackedLink';

interface Props {
  agreed: boolean;
  setAgreed: (agreed: boolean) => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

export default function Step5Payment({ agreed, setAgreed }: Props) {
  return (
    <div className="space-y-4">
      <motion.div className="mb-4" variants={containerVariants}>
        <div className="flex items-center gap-2 mb-2">
          <Image src="/icons/credit-card.svg" alt="Оплата" width={16} height={16} className="text-gray-600" />
          <span className="text-sm text-gray-600">Оплата после подтверждения заказа</span>
        </div>
      </motion.div>
      <motion.label className="flex items-start gap-2 text-sm text-gray-600" variants={containerVariants}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 form-checkbox h-4 w-4 text-black focus:ring-2 focus:ring-offset-2 focus:ring-black"
          required
          aria-label="Согласен с политикой конфиденциальности"
        />
        <span>
          Я согласен на обработку персональных данных в соответствии с{' '}
          <TrackedLink
            href="/policy"
            ariaLabel="Перейти к политике конфиденциальности"
            category="Navigation"
            action="Click Policy Link"
            label="Cart Step 5"
            className="text-black underline hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
          >
            политикой конфиденциальности
          </TrackedLink>
        </span>
      </motion.label>
    </div>
  );
}