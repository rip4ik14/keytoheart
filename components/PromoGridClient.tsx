// ✅ Путь: components/PromoGridClient.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  const [active, setActive] = useState(0);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(false);

  /* ---------------------- swipe для мобилки ---------------------- */
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 40) prev();
    if (dx < -40) next();
    touchStartX.current = null;
  }, []);

  /* ---------------------- навигация слайдов ---------------------- */
  const goTo = useCallback((idx: number, userInitiated = false) => {
    if (!banners.length) return;
    if (idx === active) return;
    if (userInitiated) setIsAutoplayEnabled(false);
    setActive(idx);
  }, [active, banners.length]);

  const prev = useCallback(() => {
    if (banners.length <= 1) return;
    goTo(active === 0 ? banners.length - 1 : active - 1, true);
  }, [active, banners.length, goTo]);

  const next = useCallback(() => {
    if (banners.length <= 1) return;
    goTo(active === banners.length - 1 ? 0 : active + 1, true);
  }, [active, banners.length, goTo]);

  /* ----------------------- автоплей (desktop) -------------------- */
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setTimeout(() => setIsAutoplayEnabled(true), 4000);
    return () => clearTimeout(timer);
  }, [banners.length]);

  useEffect(() => {
    if (!isAutoplayEnabled || banners.length <= 1) return;

    const intervalId = setInterval(() => {
      setActive((prevIndex) => (prevIndex === banners.length - 1 ? 0 : prevIndex + 1));
    }, 4500);

    return () => clearInterval(intervalId);
  }, [isAutoplayEnabled, banners.length]);

  if (!banners.length && !cards.length) return null;

  // --- helpers для позиционирования капсул как в рефе ---
  const getPillPosClass = (idx: number) => {
    if (idx === 1 || idx === 2) return 'left-3 bottom-3';
    return 'left-3 top-3';
  };

  const Card = (c: PromoBlock, idx: number, eager?: boolean) => (
    <Link
      key={c.id}
      href={c.href}
      className="group relative overflow-hidden rounded-[24px] block h-full w-full"
      title={c.title}
    >
      <Image
        src={c.image_url}
        alt={c.title}
        fill
        sizes="(max-width: 1024px) 320px, 260px"
        loading={eager ? 'eager' : 'lazy'}
        priority={!!eager}
        fetchPriority={eager ? 'high' : undefined}
        quality={82}
        placeholder="blur"
        blurDataURL={BLUR_SRC}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />

      {/* лёгкий затемняющий слой на hover как в ecom */}
      <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />

      {/* капсула - как в рефе, позиции: часть сверху, часть снизу */}
      <span
        className={`
          absolute ${getPillPosClass(idx)} z-10
          inline-flex w-fit max-w-[calc(100%-24px)]
          items-center
          rounded-full
          bg-white/85 backdrop-blur
          px-3 py-[6px]
          text-[12px] font-medium text-black
          shadow-[0_6px_18px_rgba(0,0,0,0.18)]
        `}
        style={{
          lineHeight: '1.05',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }}
      >
        {c.title}
      </span>
    </Link>
  );

  const desktopCards = cards.slice(0, 4);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="promo-grid-title">
      <h2 id="promo-grid-title" className="sr-only">
        Промо-блоки
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[2fr_1fr] lg:gap-[28px]">
        {/* ================== БАННЕР-СЛАЙДЕР ================== */}
        <div
          className="relative overflow-hidden rounded-[32px] flex flex-col"
          style={{ aspectRatio: '3/2', minHeight: 0 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative h-full w-full">
            {banners.map((b, i) => {
              let translate = 'translate-x-full opacity-0 z-0';
              if (i === active) translate = 'translate-x-0 opacity-100 z-10';
              else if (
                (i < active && !(active === banners.length - 1 && i === 0)) ||
                (active === 0 && i === banners.length - 1)
              ) {
                translate = '-translate-x-full opacity-0 z-0';
              }

              const hasText = !!(b.title || b.subtitle || b.button_text);
              const shouldOverlay = i === active && hasText;

              return (
                <div
                  key={b.id}
                  className={`absolute top-0 left-0 w-full h-full transition-all ${translate}`}
                  style={{ transitionProperty: 'transform, opacity', transitionDuration: '400ms' }}
                  aria-hidden={i !== active}
                >
                  <Link href={b.href || '#'} className="block h-full w-full" title={b.title}>
                    <div className="relative w-full h-full overflow-hidden rounded-[32px]">
                      <Image
                        src={b.image_url}
                        alt={b.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 880px"
                        priority={i === 0}
                        fetchPriority={i === 0 ? 'high' : undefined}
                        quality={85}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        placeholder="blur"
                        blurDataURL={BLUR_SRC}
                        className="object-cover rounded-[32px] transition-transform duration-500"
                      />

                      {/* ✅ FIX: баннер НЕ темним постоянно - только когда реально нужен контраст под текст */}
                      {shouldOverlay ? (
                        <>
                          {/* лёгкое общее затемнение */}
                          <div className="absolute inset-0 bg-black/10" />
                          {/* мягкий градиент под текст */}
                          <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
                        </>
                      ) : null}

                      <div className="absolute inset-0 flex flex-col justify-center items-start px-6 sm:px-9 py-7 sm:py-9 text-white">
                        {i === active && (
                          <h2
                            className="mb-4 text-xl sm:text-2xl md:text-3xl lg:text-[40px]
                                       leading-tight font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]
                                       max-w-[95%] text-white"
                          >
                            {b.title}
                          </h2>
                        )}

                        {b.subtitle && i === active && (
                          <p className="mb-6 text-sm sm:text-lg font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] max-w-[70%]">
                            {b.subtitle}
                          </p>
                        )}

                        {b.button_text && i === active && (
                          <span className="inline-flex items-center border border-[#bdbdbd] rounded-[16px] px-6 py-2 sm:px-8 sm:py-3 font-bold text-base uppercase bg-white text-[#535353] shadow-sm transition hover:bg-[#535353] hover:text-white">
                            {b.button_text}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}

            {banners.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/80 p-2 shadow hover:bg-white transition hidden sm:flex"
                  aria-label="Назад"
                  onClick={prev}
                  type="button"
                >
                  <svg width={20} height={20}>
                    <path
                      d="M13 4l-6 6 6 6"
                      stroke="#333"
                      strokeWidth={2}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/80 p-2 shadow hover:bg-white transition hidden sm:flex"
                  aria-label="Вперёд"
                  onClick={next}
                  type="button"
                >
                  <svg width={20} height={20}>
                    <path
                      d="M7 4l6 6-6 6"
                      stroke="#333"
                      strokeWidth={2}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i, true)}
                      aria-label={`Показать баннер ${i + 1}`}
                      className={`w-2.5 h-2.5 rounded-full border transition ${
                        i === active ? 'bg-white/90 border-white' : 'bg-white/40 border-white/40'
                      }`}
                      type="button"
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ================== КАРТОЧКИ (desktop, мозаика как Labberry) ================== */}
        <div className="hidden lg:flex h-full gap-[20px]">
          {/* левая колонка: высокая + низкая */}
          <div className="flex-1 flex flex-col gap-[20px] min-h-0">
            <div className="flex-[6] min-h-0">{desktopCards[0] && Card(desktopCards[0], 0, true)}</div>
            <div className="flex-[4] min-h-0">{desktopCards[2] && Card(desktopCards[2], 2)}</div>
          </div>

          {/* правая колонка: низкая + высокая */}
          <div className="flex-1 flex flex-col gap-[20px] min-h-0">
            <div className="flex-[4] min-h-0">{desktopCards[1] && Card(desktopCards[1], 1)}</div>
            <div className="flex-[6] min-h-0">{desktopCards[3] && Card(desktopCards[3], 3)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 mb-2 sm:mb-4 text-center">
        <p className="text-sm sm:text-base md:text-lg text-black/70 font-medium leading-snug">
          Клубника в бельгийском шоколаде и цветы с доставкой 30 минут по Краснодару
        </p>
      </div>
    </section>
  );
}