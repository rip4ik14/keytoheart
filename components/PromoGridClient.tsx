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
  const desktopBanners = banners.slice(0, 5);
  const desktopCards = cards.slice(0, 4);

  // Мобайл: баннеры и карточки вместе
  const mobileItems = [...banners, ...cards];

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: i * 0.2, ease: 'easeOut' },
    }),
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Десктоп: Swiper баннеров */}
        <div className="lg:col-span-2 relative rounded-2xl lg:rounded-3xl overflow-hidden aspect-[3/2]">
          <div className="hidden lg:block w-full h-full">
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 6000 }}
              pagination={{ clickable: true }}
              loop
              className="h-full w-full"
              onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
            >
              {desktopBanners.map((b, i) => (
                <SwiperSlide key={b.id}>
                  <Link href={b.href || '#'} className="relative block h-full w-full" title={b.title}>
                    <WebpImage
                      src={b.image_url}
                      alt={b.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      priority={i === 0}
                      className="object-cover rounded-2xl lg:rounded-3xl"
                      style={{ aspectRatio: '3 / 2' }}
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-2xl lg:rounded-3xl" />
                    <div className="absolute inset-0 flex flex-col justify-center items-start px-4 py-4 sm:px-12 lg:px-16 sm:py-8 lg:py-12 text-white">
                      <div className="max-w-full w-full">
                        <motion.h2
                          className="mb-2 text-lg xs:text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white max-w-[95vw] sm:max-w-[80vw] leading-tight sm:mb-3 lg:mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
                          variants={textVariants}
                          initial="hidden"
                          animate={activeSlide === i ? 'visible' : 'hidden'}
                          custom={0}
                        >
                          {b.title}
                        </motion.h2>
                        {b.subtitle && (
                          <motion.p
                            className="mb-3 text-sm xs:text-base sm:text-lg lg:text-xl text-white/90 max-w-[95vw] sm:max-w-[80vw] sm:mb-4 lg:mb-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                            variants={textVariants}
                            initial="hidden"
                            animate={activeSlide === i ? 'visible' : 'hidden'}
                            custom={1}
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
                            className="inline-flex items-center border border-[#bdbdbd] rounded-lg px-4 lg:px-6 py-2 lg:py-3 font-bold text-sm lg:text-base uppercase bg-white text-[#535353] shadow-sm hover:bg-[#535353] hover:text-white transition-all duration-200"
                          >
                            {b.button_text || 'ЗАБРАТЬ ПИОНЫ'}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          {/* Мобайл: Swiper и баннеров, и карточек */}
          <div className="block lg:hidden w-full h-full">
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 6000 }}
              pagination={{ clickable: true }}
              loop
              className="h-full w-full"
              onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
            >
              {mobileItems.map((item, i) => (
                <SwiperSlide key={item.id}>
                  <Link href={item.href || '#'} className="relative block h-full w-full" title={item.title}>
                    <WebpImage
                      src={item.image_url}
                      alt={item.title}
                      fill
                      sizes="100vw"
                      priority={i === 0}
                      className="object-cover rounded-2xl"
                      style={{ aspectRatio: '3 / 2' }}
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-2xl" />
                    <div className="absolute inset-0 flex flex-col justify-center items-start px-4 py-4 sm:px-12 sm:py-8 text-white">
                      <div className="max-w-full w-full">
                        {/* Для баннеров — полный текст, для карточек — только подпись */}
                        {item.type === 'banner' ? (
                          <>
                            <motion.h2
                              className="mb-2 text-lg xs:text-xl sm:text-3xl font-bold text-white max-w-[95vw] sm:max-w-[80vw] leading-tight sm:mb-3"
                              variants={textVariants}
                              initial="hidden"
                              animate={activeSlide === i ? 'visible' : 'hidden'}
                              custom={0}
                            >
                              {item.title}
                            </motion.h2>
                            {item.subtitle && (
                              <motion.p
                                className="mb-3 text-sm xs:text-base sm:text-lg text-white/90 max-w-[95vw] sm:max-w-[80vw] sm:mb-4"
                                variants={textVariants}
                                initial="hidden"
                                animate={activeSlide === i ? 'visible' : 'hidden'}
                                custom={1}
                              >
                                {item.subtitle}
                              </motion.p>
                            )}
                            <motion.div
                              variants={textVariants}
                              initial="hidden"
                              animate={activeSlide === i ? 'visible' : 'hidden'}
                              custom={item.subtitle ? 2 : 1}
                              className="flex"
                            >
                              <span className="inline-flex items-center border border-[#bdbdbd] rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm uppercase bg-white text-[#535353] shadow-sm hover:bg-[#535353] hover:text-white transition-all duration-200">
                                {item.button_text || 'ЗАБРАТЬ ПИОНЫ'}
                              </span>
                            </motion.div>
                          </>
                        ) : (
                          <span className="absolute bottom-3 left-3 z-10 max-w-[90%] truncate rounded-full bg-white/80 px-2.5 py-1 text-xs sm:text-sm font-semibold text-black shadow-sm line-clamp-1">
                            {item.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* Десктоп: карточки справа */}
        <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-4 h-full">
          {desktopCards.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
              className="relative w-full h-full overflow-hidden rounded-2xl lg:rounded-3xl aspect-[3/2]"
            >
              <Link href={c.href} className="group block h-full w-full" title={c.title} role="button">
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
        </div>
      </div>
    </motion.section>
  );
}
