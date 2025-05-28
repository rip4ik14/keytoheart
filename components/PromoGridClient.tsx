
'use client';

import React, { useState } from 'react';
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
  const [activeSlide, setActiveSlide] = useState(0);

  // Варианты анимации для элементов баннера (текущая: только прозрачность, более плавная)
  const textVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { duration: 0.8, delay: i * 0.4, ease: 'easeOut' }, // Увеличена длительность и задержка, мягкое завершение
    }),
  };

  // Альтернативный эффект 1: Прозрачность + Легкое масштабирование
  /*
  const textVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, delay: i * 0.4, ease: 'easeOut' },
    }),
  };
  */

  // Альтернативный эффект 2: Прозрачность + Межбуквенный интервал
  /*
  const textVariants = {
    hidden: { opacity: 0, letterSpacing: '0.1em' },
    visible: (i: number) => ({
      opacity: 1,
      letterSpacing: '0em',
      transition: { duration: 0.8, delay: i * 0.4, ease: 'easeOut' },
    }),
  };
  */

  // Альтернативный эффект 3: Прозрачность + Размытие
  /*
  const textVariants = {
    hidden: { opacity: 0, filter: 'blur(5px)' },
    visible: (i: number) => ({
      opacity: 1,
      filter: 'blur(0)',
      transition: { duration: 0.8, delay: i * 0.4, ease: 'easeOut' },
    }),
  };
  */

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
        {/* Блок баннеров */}
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
            onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
          >
            {banners.map((b, i) => (
              <SwiperSlide key={b.id}>
                <Link
                  href={b.href || '#'}
                  className="relative block h-full w-full"
                  title={b.title}
                >
                  <Image
                    src={b.image_url}
                    alt={b.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority={i === 0}
                    className="object-cover"
                  />
                  {/* Затемнение для читабельности текста */}
                  <div className="absolute inset-0 bg-black/40 transition-all duration-500" />

                  {/* Центровка и адаптация контента */}
                  <div
                    className="
                      absolute inset-0 flex flex-col justify-center
                      items-start sm:items-start
                      px-4 py-4 sm:px-16 sm:py-12
                      text-white text-left
                    "
                  >
                    <div className="max-w-full w-full">
                      <motion.h2
                        className="
                          mb-2 text-xl xs:text-2xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]
                          max-w-[95vw] sm:max-w-[80vw] leading-tight
                          sm:mb-3
                        "
                        variants={textVariants}
                        initial="hidden"
                        animate={activeSlide === i ? 'visible' : 'hidden'}
                        custom={0} // Первая задержка (заголовок)
                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
                      >
                        {b.title}
                      </motion.h2>
                      {b.subtitle && (
                        <motion.p
                          className="
                            mb-3 text-base xs:text-lg sm:text-lg text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]
                            max-w-[95vw] sm:max-w-[80vw]
                            sm:mb-6
                          "
                          variants={textVariants}
                          initial="hidden"
                          animate={activeSlide === i ? 'visible' : 'hidden'}
                          custom={1} // Вторая задержка (подзаголовок)
                          style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
                        >
                          {b.subtitle}
                        </motion.p>
                      )}
                      <motion.div
                        variants={textVariants}
                        initial="hidden"
                        animate={activeSlide === i ? 'visible' : 'hidden'}
                        custom={b.subtitle ? 2 : 1} // Третья задержка (кнопка), или вторая, если нет подзаголовка
                        className="flex"
                      >
                        <span
                          className="
                            inline-flex items-center rounded-full border border-black/70
                            bg-white px-6 py-2 text-sm font-semibold text-black shadow transition
                            hover:bg-black hover:text-white hover:shadow-2xl hover:border-white
                            active:scale-95 focus:outline-none cursor-pointer select-none
                            w-full sm:w-auto text-center justify-center
                          "
                          style={{
                            boxShadow:
                              '0 2px 12px 0 rgba(0,0,0,0.13), 0 1.5px 5px 0 rgba(0,0,0,0.07)',
                          }}
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
        </motion.div>

        {/* Карточки (desktop, справа) */}
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

        {/* Мобильная версия карточек */}
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
