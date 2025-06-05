// ✅ Путь: app/components/PromoGridClient.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import WebpImage from '@components/WebpImage';
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
  const [activeSlide, setActiveSlide] = useState(0);

  // Анимация текста
  const textVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { duration: 0.8, delay: i * 0.4, ease: 'easeOut' },
    }),
  };

  // Для мобилки: баннеры + карточки в один список
  const mobileItems = [...banners, ...cards];

  return (
    <motion.section
      className="mx-auto mt-8 sm:mt-10 max-w-7xl px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      aria-labelledby="promo-grid-title"
    >
      <h2 id="promo-grid-title" className="sr-only">
        Промо-блоки
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Баннеры/карточки для десктопа */}
        <motion.div
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl lg:col-span-2"
          style={{ aspectRatio: '3 / 2' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Десктоп: только баннеры */}
          <div className="hidden lg:block h-full w-full">
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 5000 }}
              pagination={{ clickable: true }}
              loop
              className="h-full w-full"
              onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
            >
              {banners.map((b, i) => (
                <SwiperSlide key={b.id}>
                  <Link
                    href={b.href || '#'}
                    className="relative block h-full w-full"
                    title={b.title}
                  >
                    <div className="relative w-full h-full aspect-[3/2]">
                      <WebpImage
                        src={b.image_url}
                        alt={b.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        priority={i === 0} // Приоритет для первого баннера
                        className="object-cover rounded-2xl lg:rounded-3xl"
                        style={{ aspectRatio: '3 / 2' }}
                      />
                      <div className="absolute inset-0 bg-black/20 transition-all duration-500 rounded-2xl lg:rounded-3xl" />
                      <div
                        className="
                          absolute inset-0 flex flex-col justify-center
                          items-start
                          px-4 py-4 sm:px-12 lg:px-16 sm:py-8 lg:py-12
                          text-white text-left
                        "
                      >
                        <div className="max-w-full w-full">
                          <motion.h2
                            className="
                              mb-2 text-lg xs:text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]
                              max-w-[95vw] sm:max-w-[80vw] leading-tight
                              sm:mb-3 lg:mb-4
                            "
                            variants={textVariants}
                            initial="hidden"
                            animate={activeSlide === i ? 'visible' : 'hidden'}
                            custom={0}
                            style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
                          >
                            {b.title}
                          </motion.h2>
                          {b.subtitle && (
                            <motion.p
                              className="
                                mb-3 text-sm xs:text-base sm:text-lg lg:text-xl text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]
                                max-w-[95vw] sm:max-w-[80vw]
                                sm:mb-4 lg:mb-6
                              "
                              variants={textVariants}
                              initial="hidden"
                              animate={activeSlide === i ? 'visible' : 'hidden'}
                              custom={1}
                              style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
                            >
                              {b.subtitle}
                            </motion.p>
                          )}
                          <motion.div
                            variants={textVariants}
                            initial="hidden"
                            animate={activeSlide === i ? 'visible' : 'hidden'}
                            custom={b.subtitle ? 2 : 1}
                            className="flex"
                          >
                            <span
                              className="
                                inline-flex items-center border border-[#bdbdbd] rounded-lg px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 font-bold text-xs sm:text-sm lg:text-base uppercase tracking-tight text-center 
                                bg-white text-[#535353] transition-all duration-200 shadow-sm
                                hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
                              style={{
                                minWidth: 'fit-content',
                                maxWidth: '100%',
                              }}
                              onClick={() => {
                                window.gtag?.('event', 'click_banner_cta', {
                                  event_category: 'PromoGrid',
                                  event_label: b.title,
                                });
                                window.ym?.(96644553, 'reachGoal', 'click_banner_cta', {
                                  banner: b.title,
                                });
                              }}
                            >
                              {b.button_text || 'ЗАБРАТЬ ПИОНЫ'}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          {/* Мобильная версия: Swiper с баннерами и карточками */}
          <div className="block lg:hidden h-full w-full">
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 5000 }}
              pagination={{ clickable: true }}
              loop
              spaceBetween={12}
              slidesPerView={1}
              className="h-full w-full"
              onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
            >
              {mobileItems.map((item, i) => (
                <SwiperSlide key={item.id}>
                  <Link
                    href={item.href || '#'}
                    className="relative block h-full w-full"
                    title={item.title}
                  >
                    <div className="relative w-full h-full aspect-[3/2]">
                      <WebpImage
                        src={item.image_url}
                        alt={item.title}
                        fill
                        sizes="100vw"
                        priority={i === 0} // Приоритет для первого элемента
                        className="object-cover rounded-2xl"
                        style={{ aspectRatio: '3 / 2' }}
                      />
                      <div className="absolute inset-0 bg-black/20 transition-all duration-500 rounded-2xl" />
                      <div
                        className="
                          absolute inset-0 flex flex-col justify-center
                          items-start
                          px-4 py-4 sm:px-12 sm:py-8
                          text-white text-left
                        "
                      >
                        <div className="max-w-full w-full">
                          <motion.h2
                            className="
                              mb-2 text-lg xs:text-xl sm:text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]
                              max-w-[95vw] sm:max-w-[80vw] leading-tight
                              sm:mb-3
                            "
                            variants={textVariants}
                            initial="hidden"
                            animate={activeSlide === i ? 'visible' : 'hidden'}
                            custom={0}
                            style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
                          >
                            {item.title}
                          </motion.h2>
                          {item.subtitle && item.type === 'banner' && (
                            <motion.p
                              className="
                                mb-3 text-sm xs:text-base sm:text-lg text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]
                                max-w-[95vw] sm:max-w-[80vw]
                                sm:mb-4
                              "
                              variants={textVariants}
                              initial="hidden"
                              animate={activeSlide === i ? 'visible' : 'hidden'}
                              custom={1}
                              style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
                            >
                              {item.subtitle}
                            </motion.p>
                          )}
                          {item.type === 'banner' && (
                            <motion.div
                              variants={textVariants}
                              initial="hidden"
                              animate={activeSlide === i ? 'visible' : 'hidden'}
                              custom={item.subtitle ? 2 : 1}
                              className="flex"
                            >
                              <span
                                className="
                                  inline-flex items-center border border-[#bdbdbd] rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
                                  bg-white text-[#535353] transition-all duration-200 shadow-sm
                                  hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
                                style={{
                                  minWidth: 'fit-content',
                                  maxWidth: '100%',
                                }}
                                onClick={() => {
                                  window.gtag?.('event', 'click_banner_cta', {
                                    event_category: 'PromoGrid',
                                    event_label: item.title,
                                  });
                                  window.ym?.(96644553, 'reachGoal', 'click_banner_cta', {
                                    banner: item.title,
                                  });
                                }}
                              >
                                {item.button_text || 'ЗАБРАТЬ ПИОНЫ'}
                              </span>
                            </motion.div>
                          )}
                          {item.type === 'card' && (
                            <span className="absolute bottom-3 left-3 z-10 max-w-[90%] truncate rounded-full bg-white/80 px-2.5 py-1 text-xs sm:text-sm font-semibold text-black shadow-sm line-clamp-1">
                              {item.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </motion.div>

        {/* Карточки для десктопа (справа) */}
        <motion.div
          className="hidden lg:grid h-full grid-cols-2 grid-rows-2 gap-4"
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
              className="relative w-full h-full overflow-hidden rounded-2xl lg:rounded-3xl aspect-[3/2]"
            >
              <Link
                href={c.href}
                className="group block h-full w-full"
                title={c.title}
                role="button"
              >
                <WebpImage
                  src={c.image_url}
                  alt={c.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-2xl lg:rounded-3xl"
                  style={{ aspectRatio: '3 / 2' }}
                />
                <div className="absolute inset-0 bg-black/10 transition-all group-hover:bg-black/30 rounded-2xl lg:rounded-3xl" />
                <span className="absolute bottom-3 left-3 z-10 max-w-[90%] truncate rounded-full bg-white/80 px-2.5 py-1 text-xs lg:text-sm font-semibold text-black shadow-sm line-clamp-1">
                  {c.title}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}