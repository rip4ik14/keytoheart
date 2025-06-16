// ✅ Путь: components/CorporateHero.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

export default function CorporateHero() {
  return (
    <section
      aria-labelledby="corporate-hero-title"
      className="px-4 md:px-8 py-12 md:py-16"
    >
      {/* баннер в контейнере */}
      <motion.div
        className="relative max-w-6xl mx-auto h-64 md:h-80 rounded-lg overflow-hidden flex items-center justify-center text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        {/* фон */}
        <Image
          src="/images/corporate-hero-banner.webp"
          alt="Корпоративные подарки KEY TO HEART"
          fill
          priority
          className="object-cover object-center pointer-events-none select-none"
        />

        {/* затемнитель */}
        <div className="absolute inset-0 bg-black/50" aria-hidden />

        {/* контент */}
        <div className="relative z-10 text-white px-4 space-y-4">
          {/* теперь явно white */}
          <h1
            id="corporate-hero-title"
            className="text-3xl md:text-5xl font-bold text-white"
          >
            Корпоративные подарки от KEY TO HEART
          </h1>

          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Уникальные фруктово-цветочные композиции и боксы&nbsp;— для ваших
            коллег, клиентов и партнёров. Эмоции, которые запомнятся.
          </p>

          <Link
            href="/catalog"
            className="inline-block rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight
              border border-[#bdbdbd] bg-white text-[#535353] shadow-sm transition-colors duration-200
              hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
            onClick={() => {
              window.gtag?.('event', 'click_hero_cta', {
                event_category: 'CorporateHero',
                event_label: 'Order Gifts',
              });
              callYm(YM_ID, 'reachGoal', 'click_hero_cta');
            }}
          >
            Заказать подарки
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
