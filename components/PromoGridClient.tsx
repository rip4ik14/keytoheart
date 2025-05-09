'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

interface Block {
  id: number;
  title: string;
  subtitle?: string;
  href: string;
  image_url: string;
  type: 'card' | 'banner';
  button_text?: string;
}

export default function PromoGridClient({
  banners,
  cards,
}: {
  banners: Block[];
  cards: Block[];
}) {
  return (
    <motion.section
      className="mx-auto mt-10 max-w-7xl px-4"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      aria-labelledby="promo-grid-title"
    >
      <h2 id="promo-grid-title" className="sr-only">
        Промо-блоки
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          className="relative overflow-hidden rounded-3xl lg:col-span-2 h-[260px] sm:h-[340px] md:h-[420px] lg:h-[480px] xl:h-[560px]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 5000 }}
            pagination={{ clickable: true }}
            loop
            className="h-full w-full"
          >
            {banners.map((b, i) => (
              <SwiperSlide key={b.id}>
                <Link
                  href={b.href || '#'}
                  className="relative block h-full w-full"
                  title={b.title}
                  onClick={() => {
                    window.gtag?.('event', 'promo_banner_click', {
                      event_category: 'promo',
                      banner_id: b.id,
                    });
                    window.ym?.(12345678, 'reachGoal', 'promo_banner_click', {
                      banner_id: b.id,
                    });
                  }}
                >
                  <Image
                    src={b.image_url}
                    alt={b.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority={i === 0}
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 flex flex-col justify-end items-center px-6 py-8 md:px-16 md:py-12 text-white text-center">
                    <div className="max-w-2xl">
                      <motion.h2
                        className="mb-3 line-clamp-2 text-4xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        {b.title}
                      </motion.h2>
                      {b.subtitle && (
                        <motion.p
                          className="mb-4 line-clamp-2 text-base md:text-lg text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                        >
                          {b.subtitle}
                        </motion.p>
                      )}
                      <motion.div
                        className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-bold text-black shadow transition md:text-base hover:scale-105 hover:shadow-xl hover:bg-white/90 hover:ring-2 hover:ring-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                      >
                        {b.button_text || 'Подробнее'}
                      </motion.div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

        <motion.div
          className="hidden lg:grid h-[480px] xl:h-[560px] grid-cols-2 grid-rows-2 gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {cards.slice(0, 4).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className="relative h-full w-full overflow-hidden rounded-3xl"
            >
              <Link
                href={c.href}
                className="group block h-full w-full"
                title={c.title}
                role="button"
                onClick={() => {
                  window.gtag?.('event', 'promo_card_click', {
                    event_category: 'promo',
                    card_id: c.id,
                  });
                  window.ym?.(12345678, 'reachGoal', 'promo_card_click', {
                    card_id: c.id,
                  });
                }}
              >
                <Image
                  src={c.image_url}
                  alt={c.title}
                  fill
                  sizes="50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 transition-all group-hover:bg-black/30" />
                <span className="absolute bottom-3 left-3 z-10 max-w-[90%] truncate rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-black shadow-sm line-clamp-1">
                  {c.title}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="block lg:hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Swiper spaceBetween={12} slidesPerView={1.2} className="mt-4 pb-6">
            {cards.map((c, i) => (
              <SwiperSlide key={c.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                >
                  <Link
                    href={c.href}
                    className="group relative aspect-[3/2] overflow-hidden rounded-3xl"
                    title={c.title}
                    role="button"
                    onClick={() => {
                      window.gtag?.('event', 'promo_card_click', {
                        event_category: 'promo',
                        card_id: c.id,
                      });
                      window.ym?.(12345678, 'reachGoal', 'promo_card_click', {
                        card_id: c.id,
                      });
                    }}
                  >
                    <Image
                      src={c.image_url}
                      alt={c.title}
                      fill
                      sizes="90vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 transition-all group-hover:bg-black/30" />
                    <span className="absolute bottom-3 left-3 z-10 max-w-[90%] truncate rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-black shadow-sm line-clamp-1">
                      {c.title}
                    </span>
                  </Link>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </motion.section>
  );
}