'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [direction, setDirection] = useState(0); // -1 влево, 1 вправо
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(false);

  /* ---------------------- swipe для мобилки ---------------------- */
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) =>
    (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 40) prev();
    if (dx < -40) next();
    touchStartX.current = null;
  };

  /* ---------------------- навигация слайдов ---------------------- */
  const goTo = (idx: number, userInitiated = false) => {
    if (idx === active) return;
    if (userInitiated) setIsAutoplayEnabled(false); // стопим автоплей при действиях пользователя
    setDirection(idx > active ? 1 : -1);
    setActive(idx);
  };

  const prev = () =>
    goTo(active === 0 ? banners.length - 1 : active - 1, true);

  const next = () =>
    goTo(active === banners.length - 1 ? 0 : active + 1, true);

  /* ----------------------- сброс анимации ------------------------ */
  useEffect(() => {
    const t = setTimeout(() => setDirection(0), 350);
    return () => clearTimeout(t);
  }, [active]);

  /* ----------------------- автоплей (desktop) -------------------- */
  // 1) через 4 секунды после гидратации включаем автоплей
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setTimeout(() => {
      setIsAutoplayEnabled(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [banners.length]);

  // 2) сам автоплей – крутится только если включён, LCP уже отрисован
  useEffect(() => {
    if (!isAutoplayEnabled || banners.length <= 1) return;

    const intervalId = setInterval(() => {
      // Автоплей всегда листает вперёд
      setDirection(1);
      setActive((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1,
      );
    }, 4500);

    return () => clearInterval(intervalId);
  }, [isAutoplayEnabled, banners.length]);

  return (
    <section
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-labelledby="promo-grid-title"
    >
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
              /* slide position */
              let translate = 'translate-x-full opacity-0 z-0';
              if (i === active) translate = 'translate-x-0 opacity-100 z-10';
              else if (
                (i < active && !(active === banners.length - 1 && i === 0)) ||
                (active === 0 && i === banners.length - 1)
              )
                translate = '-translate-x-full opacity-0 z-0';

              return (
                <div
                  key={b.id}
                  className={`
                    absolute top-0 left-0 w-full h-full
                    transition-all duration-400 ${translate}
                  `}
                  style={{ transitionProperty: 'transform, opacity' }}
                  aria-hidden={i !== active}
                >
                  <Link
                    href={b.href || '#'}
                    className="block h-full w-full"
                    title={b.title}
                  >
                    <div className="relative w-full h-full overflow-hidden rounded-[32px]">
                      <Image
                        src={b.image_url}
                        alt={b.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 880px"
                        priority={i === 0}
                        fetchPriority={i === 0 ? 'high' : undefined}
                        placeholder="blur"
                        blurDataURL={BLUR_SRC}
                        className="object-cover rounded-[32px] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/30" />

                      {/* ---------- Текст + кнопка ----------- */}
                      <div className="absolute inset-0 flex flex-col justify-center items-start px-6 sm:px-9 py-7 sm:py-9 text-white">
                        {/* заменили h1 → h2 (сохранили стили) */}
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

            {/* стрелки и пагинация */}
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
                        i === active
                          ? 'bg-white/90 border-white'
                          : 'bg-white/40 border-white/40'
                      }`}
                      type="button"
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ================== КАРТОЧКИ (desktop) ================== */}
        <div className="hidden lg:grid h-full grid-cols-2 grid-rows-2 gap-[20px] auto-rows-fr min-h-[320px]">
          {cards.slice(0, 4).map((c, i) => (
            <div
              key={c.id}
              className="relative w-full h-full overflow-hidden rounded-[24px] transition-transform duration-300"
            >
              <Link
                href={c.href}
                className="group block h-full w-full"
                title={c.title}
              >
                <div className="relative w-full h-full rounded-[24px] overflow-hidden">
                  <Image
                    src={c.image_url}
                    alt={c.title}
                    fill
                    sizes="(max-width: 1024px) 320px, 240px"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    priority={i === 0}
                    fetchPriority={i === 0 ? 'high' : undefined}
                    placeholder="blur"
                    blurDataURL={BLUR_SRC}
                    className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-[24px]"
                  />
                  <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/30" />
                  <span
                    className="absolute bottom-3 left-3 z-10 px-3 py-2 bg-white/80 rounded-full text-xs lg:text-sm font-semibold text-black shadow-sm flex items-center whitespace-normal break-words max-w-[calc(100%-24px)] min-h-[28px] transition-all"
                    style={{ lineHeight: '1.2' }}
                  >
                    {c.title}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
        {/* мобильные карточки скрыты */}
      </div>

      {/* Подзаголовок под промо-блоком */}
      <div className="mt-4 sm:mt-6 mb-2 sm:mb-4 text-center">
        <p className="text-sm sm:text-base md:text-lg text-black/70 font-medium leading-snug">
          Клубника в бельгийском шоколаде и цветы с доставкой 30 минут по
          Краснодару
        </p>
      </div>
    </section>
  );
}
