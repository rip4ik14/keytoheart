// ✅ Путь: components/CorporateFooterCTA.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface CorporateFooterCTAProps {}

export default function CorporateFooterCTA({}: CorporateFooterCTAProps) {
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section
      className="py-16 px-4 md:px-8 bg-black text-white text-center"
      aria-labelledby="corporate-cta-title"
    >
      <motion.h2
        id="corporate-cta-title"
        className="text-3xl md:text-4xl font-bold mb-4"
        variants={textVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        Готовы сделать заказ?
      </motion.h2>
      <motion.p
        className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-white/80"
        variants={textVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        Оставьте заявку, и мы свяжемся с вами в течение 15 минут для обсуждения деталей.
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
          className="inline-block bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          scroll={true}
          prefetch={false}
          aria-label="Оставить заявку на корпоративные подарки"
          onClick={() => {
            window.gtag?.('event', 'corporate_cta_click', { event_category: 'corporate' });
            window.ym?.(96644553, 'reachGoal', 'corporate_cta_click');
          }}
        >
          Оставить заявку
        </Link>
      </motion.div>
    </section>
  );
}