'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CorporateHero() {
  return (
    <section
      className="w-full bg-black text-white py-20 px-4 md:px-8 text-center"
      aria-labelledby="corporate-hero-title"
    >
      <motion.h1
        id="corporate-hero-title"
        className="text-3xl md:text-5xl font-bold mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Корпоративные подарки от KeyToHeart
      </motion.h1>
      <motion.p
        className="text-lg md:text-xl max-w-2xl mx-auto opacity-80 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Уникальные фруктово-цветочные композиции и боксы — для ваших коллег, клиентов и партнёров. Эмоции, которые запомнятся.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Link
          href="/catalog"
          className="inline-block border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
            bg-white text-[#535353] transition-all duration-200 shadow-sm
            hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
          onClick={() => {
            window.gtag?.('event', 'click_hero_cta', { event_category: 'CorporateHero', event_label: 'Order Gifts' });
            window.ym?.(12345678, 'reachGoal', 'click_hero_cta');
          }}
        >
          Заказать подарки
        </Link>
      </motion.div>
    </section>
  );
}