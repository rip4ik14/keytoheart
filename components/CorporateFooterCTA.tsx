'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

export default function CorporateFooterCTA() {
  const textVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section
      aria-labelledby="corporate-cta-title"
      className="py-16 px-4 md:px-8 text-center"
    >
      <motion.h2
        id="corporate-cta-title"
        className="text-3xl md:text-4xl font-bold mb-4 text-black"
        variants={textVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        Готовы сделать заказ?
      </motion.h2>

      <motion.p
        className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-700"
        variants={textVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        Оставьте заявку, и мы свяжемся с вами в течение 15 минут для обсуждения деталей.
      </motion.p>

      <motion.div
        variants={textVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
      >
        <Link
          href="#form"
          scroll
          prefetch={false}
          aria-label="Оставить заявку на корпоративные подарки"
          className="inline-block rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight
            border border-[#bdbdbd] bg-white text-[#535353] shadow-sm transition-colors duration-200
            hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
          onClick={() => {
            window.gtag?.('event', 'corporate_cta_click', {
              event_category: 'corporate',
            });
            if (YM_ID !== undefined) {
              callYm(YM_ID, 'reachGoal', 'corporate_cta_click');
            }
          }}
        >
          Оставить заявку
        </Link>
      </motion.div>
    </section>
  );
}