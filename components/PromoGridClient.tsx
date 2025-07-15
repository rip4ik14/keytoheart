'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { PromoBlock } from '@/types/promo';

const BLUR_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z/C/HwMDAwMjIxEABAMAATN4A+QAAAAASUVORK5CYII=';

export default function PromoGridClient({
  banners,
  cards,
}: {
  banners: PromoBlock[];
  cards: PromoBlock[];
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const lcpImage = banners[0]?.image_url;

  /* анимация текста */
  const textVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { duration: 0.8, delay: i * 0.4, ease: 'easeOut' },
    }),
  };

  /* мобилка — только баннеры */
  const mobileItems = banners;

  /* включаем loop только если > 1 слайда */
  const loopEnabled = banners.length > 1;

  return (
    <>
      {lcpImage && (
        <Head>
          <link rel="preload" as="image" href={lcpImage} fetchPriority="high" />
        </Head>
      )}

      <motion.section
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        aria-labelledby="promo-grid-title"
      >
        <h2 id="promo-grid-title" className="sr-only">
          Промо‑блоки
        </h2>

        <div
          className="
            grid grid-cols-1 gap-4
            sm:gap-5
            lg:grid-cols-[2fr_1fr] lg:gap-[28px]
          "
        >
          {/* ───────── Баннеры (слева) ───────── */}
          <motion.div
            className="relative overflow-hidden rounded-[32px]"
            style={{ aspectRatio: '3/2', minHeight: 0 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* --- десктоп: autoplay + loop --- */}
            <div className="hidden lg:block h-full w-full">
              <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={loopEnabled ? { delay: 10000 } : false}
                pagination={{ clickable: true }}
                loop={loopEnabled}
                className="h-full w-full"
                onSlideChange={(s) => setActiveSlide(s.realIndex)}
              >
                {banners.map((b, i) => (
                  <SwiperSlide key={b.id}>
                    <Link
                      href={b.href || '#'}
                      className="block h-full w-full"
                      title={b.title}
                    >
                      <div className="relative h-full w-full rounded-[32px] overflow-hidden">
                        <Image
                          src={b.image_url}
                          alt={b.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 66vw"
                          priority={i === 0}
                          placeholder="blur"
                          blurDataURL={BLUR_SRC}
                          className="object-cover rounded-[32px]"
                        />
                        <div className="absolute inset-0 bg-black/30" />

                        {/* тексты + CTA */}
                        <div className="absolute inset-0 flex flex-col justify-center items-start px-9 py-9 text-white">
                          <motion.h1
                            className="mb-4 text-[40px] leading-tight font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] max-w-[680px]"
                            variants={textVariants}
                            initial="hidden"
                            animate={activeSlide === i ? 'visible' : 'hidden'}
                            custom={0}
                          >
                            {b.title}
                          </motion.h1>

                          {b.subtitle && (
                            <motion.p
                              className="mb-6 text-lg font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] max-w-[480px]"
                              variants={textVariants}
                              initial="hidden"
                              animate={activeSlide === i ? 'visible' : 'hidden'}
                              custom={1}
                            >
                              {b.subtitle}
                            </motion.p>
                          )}

                          {b.button_text && (
                            <motion.div
                              variants={textVariants}
                              initial="hidden"
                              animate={activeSlide === i ? 'visible' : 'hidden'}
                              custom={b.subtitle ? 2 : 1}
                            >
                              <span className="inline-flex items-center border border-[#bdbdbd] rounded-[16px] px-8 py-3 font-bold text-base uppercase bg-white text-[#535353] shadow-sm transition hover:bg-[#535353] hover:text-white">
                                {b.button_text}
                              </span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* --- мобилка: без autoplay, loop по условию --- */}
            <div className="block lg:hidden h-full w-full">
              <Swiper
                modules={[Pagination]}
                pagination={{ clickable: true }}
                loop={loopEnabled}
                slidesPerView={1}
                spaceBetween={12}
                className="h-full w-full"
                onSlideChange={(s) => setActiveSlide(s.realIndex)}
              >
                {mobileItems.map((b, i) => (
                  <SwiperSlide key={b.id}>
                    <Link
                      href={b.href || '#'}
                      className="block h-full w-full"
                      title={b.title}
                    >
                      <div className="relative h-full w-full rounded-[24px] overflow-hidden">
                        <Image
                          src={b.image_url}
                          alt={b.title}
                          fill
                          sizes="100vw"
                          priority={i === 0}
                          placeholder="blur"
                          blurDataURL={BLUR_SRC}
                          className="object-cover rounded-[24px]"
                        />
                        <div className="absolute inset-0 bg-black/20" />

                        <div className="absolute inset-0 flex flex-col justify-center items-start px-4 py-4 sm:px-8 sm:py-8 text-white">
                          <motion.h1
                            className="mb-2 text-xl sm:text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] leading-tight"
                            variants={textVariants}
                            initial="hidden"
                            animate={activeSlide === i ? 'visible' : 'hidden'}
                            custom={0}
                          >
                            {b.title}
                          </motion.h1>

                          {b.subtitle && (
                            <motion.p
                              className="mb-3 text-sm sm:text-lg text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                              variants={textVariants}
                              initial="hidden"
                              animate={activeSlide === i ? 'visible' : 'hidden'}
                              custom={1}
                            >
                              {b.subtitle}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </motion.div>

          {/* ───────── Карточки (справа, только десктоп) ───────── */}
          <motion.div
            className="hidden lg:grid grid-cols-2 grid-rows-2 gap-[20px] auto-rows-fr"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ minHeight: '320px' }}
          >
            {cards.slice(0, 4).map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="relative w-full h-full overflow-hidden rounded-[24px]"
              >
                <Link
                  href={c.href}
                  className="group block relative h-full w-full"
                  title={c.title}
                >
                  <Image
                    src={c.image_url}
                    alt={c.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    placeholder="blur"
                    blurDataURL={BLUR_SRC}
                    className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-[24px]"
                  />
                  <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/30" />
                  <span className="absolute bottom-3 left-3 z-10 max-w-[90%] truncate rounded-full bg-white/80 px-2.5 py-1 text-xs lg:text-sm font-semibold text-black shadow-sm">
                    {c.title}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}
