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
      className="px-0 sm:px-4 md:px-8 py-8 sm:py-12 md:py-16"
    >
      <motion.div
        className="
          relative
          w-full
          max-w-6xl
          mx-auto
          min-h-[320px]
          sm:min-h-[350px]
          md:min-h-[420px]
          flex items-center justify-center text-center
          overflow-hidden
          rounded-xl
        "
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Image
          src="/images/corporate-hero-banner.webp"
          alt="Корпоративные подарки KEY TO HEART"
          fill
          priority
          className="object-cover object-center pointer-events-none select-none"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div
          className="
            relative z-10 text-white
            flex flex-col justify-center items-center
            px-2 xs:px-3 sm:px-8 py-4 w-full h-full
          "
        >
          <h1
            id="corporate-hero-title"
            className="
              font-bold text-white leading-tight
              text-2xl xs:text-3xl sm:text-4xl md:text-5xl
              max-w-[95vw] sm:max-w-[80vw] md:max-w-3xl mx-auto
              break-words
            "
            style={{ wordBreak: 'break-word', hyphens: 'auto' }}
          >
            Корпоративные подарки от KEY TO HEART
          </h1>
          <p
            className="
              text-base xs:text-lg sm:text-xl md:text-xl
              opacity-90 max-w-[98vw] sm:max-w-2xl mx-auto mt-4
              break-words
            "
            style={{ wordBreak: 'break-word', hyphens: 'auto' }}
          >
            Уникальные фруктово-цветочные композиции и боксы — для ваших коллег, клиентов и партнёров. Эмоции, которые запомнятся.
          </p>
          <Link
            href="/catalog"
            className="
              mt-6
              inline-block rounded-[10px]
              px-4 sm:px-6 py-2 sm:py-3
              font-bold text-xs sm:text-sm uppercase tracking-tight
              border border-[#bdbdbd] bg-white text-[#535353] shadow-sm
              transition-colors duration-200
              hover:bg-[#535353] hover:text-white
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]
            "
            onClick={() => {
              window.gtag?.('event', 'click_hero_cta', {
                event_category: 'CorporateHero',
                event_label: 'Order Gifts',
              });
              if (YM_ID !== undefined) {
                callYm(YM_ID, 'reachGoal', 'click_hero_cta');
              }
            }}
          >
            Заказать подарки
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
