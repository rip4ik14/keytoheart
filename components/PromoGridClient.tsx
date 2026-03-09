// ✅ Путь: components/PromoGridClient.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PromoBlock } from '@/types/promo';
import { isExternalUrl, withSupabaseTransform } from './imagePerf';

const BLUR_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z/C/HwMDAwMjIxEABAMAATN4A+QAAAAASUVORK5CYII=';

function isVideoUrl(url?: string | null) {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov');
}

export default function PromoGridClient({
  banners,
  cards,
}: {
  banners: PromoBlock[];
  cards: PromoBlock[];
}) {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(false);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 40) prev(true);
    if (dx < -40) next(true);

    touchStartX.current = null;
  };

  const goTo = (idx: number, user = false) => {
    if (!banners.length) return;
    if (user) setAutoplay(false);

    setActive(() => {
      if (idx < 0) return 0;
      if (idx > banners.length - 1) return banners.length - 1;
      return idx;
    });
  };

  const prev = (user = false) => {
    if (!banners.length) return;
    goTo(active === 0 ? banners.length - 1 : active - 1, user);
  };

  const next = (user = false) => {
    if (!banners.length) return;
    goTo(active === banners.length - 1 ? 0 : active + 1, user);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setTimeout(() => setAutoplay(true), 4000);
    return () => clearTimeout(t);
  }, [banners.length]);

  useEffect(() => {
    if (!autoplay || banners.length <= 1) return;

    const id = setInterval(() => {
      setActive((p) => (p === banners.length - 1 ? 0 : p + 1));
    }, 4500);

    return () => clearInterval(id);
  }, [autoplay, banners.length]);

  const desktopCards = useMemo(() => cards.slice(0, 4), [cards]);

  if (!banners.length && !cards.length) return null;

  const BannerMedia = ({
    b,
    isActive,
    priority,
    mode,
  }: {
    b: PromoBlock;
    isActive: boolean;
    priority?: boolean;
    mode: 'mobile' | 'desktop';
  }) => {
    const video = isVideoUrl(b.image_url);

    if (video) {
      return isActive ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={b.image_url}
          muted
          playsInline
          autoPlay
          loop
          preload={priority ? 'auto' : 'metadata'}
        />
      ) : (
        <div className="absolute inset-0 bg-black/[0.06]" />
      );
    }

    const imageSrc = withSupabaseTransform(
      b.image_url,
      mode === 'desktop' ? 1440 : 960,
      mode === 'desktop' ? 76 : 72
    );

    return (
      <Image
        src={imageSrc}
        alt={b.title || 'Промо'}
        fill
        sizes={mode === 'desktop' ? '(max-width: 1280px) 66vw, 920px' : '100vw'}
        priority={!!priority}
        fetchPriority={priority ? 'high' : undefined}
        placeholder="blur"
        blurDataURL={BLUR_SRC}
        className="object-cover"
        unoptimized={isExternalUrl(imageSrc)}
      />
    );
  };

  return (
    <section aria-labelledby="promo-grid-title">
      <h2 id="promo-grid-title" className="sr-only">
        Промо-блоки
      </h2>

      {/* MOBILE */}
      <div className="lg:hidden">
        <div
          ref={heroRef}
          id="home-promo"
          className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden rounded-t-[28px] bg-white"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="relative w-full overflow-hidden rounded-t-[28px]"
            style={{ height: 'clamp(280px, 42vh, 380px)' }}
          >
            {banners.map((b, i) => {
              const isActiveSlide = i === active;

              let translate = 'translate-x-full opacity-0 z-0';
              if (isActiveSlide) {
                translate = 'translate-x-0 opacity-100 z-10';
              } else if (
                (i < active && !(active === banners.length - 1 && i === 0)) ||
                (active === 0 && i === banners.length - 1)
              ) {
                translate = '-translate-x-full opacity-0 z-0';
              }

              const hasText = !!(b.title || b.subtitle);
              const showText = isActiveSlide && hasText;

              return (
                <div
                  key={b.id}
                  className={`absolute inset-0 transition-all ${translate}`}
                  style={{ transitionProperty: 'transform, opacity', transitionDuration: '420ms' }}
                  aria-hidden={!isActiveSlide}
                >
                  <Link
                    href={b.href || '#'}
                    className="block h-full w-full"
                    title={b.title || undefined}
                  >
                    <div className="absolute inset-0">
                      <BannerMedia b={b} isActive={isActiveSlide} priority={i === 0} mode="mobile" />
                      {showText ? (
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/45" />
                      ) : null}
                    </div>

                    {showText ? (
                      <div className="absolute inset-x-0 bottom-[56px] px-4 pb-0 pt-10 text-white">
                        {b.title ? (
                          <div className="text-[28px] font-extrabold leading-[1.05] drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                            {b.title}
                          </div>
                        ) : null}

                        {b.subtitle ? (
                          <div className="mt-2 text-[14px] font-medium text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                            {b.subtitle}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </Link>
                </div>
              );
            })}

            {banners.length > 1 && (
              <div className="absolute bottom-[26px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i, true)}
                    aria-label={`Показать баннер ${i + 1}`}
                    className={[
                      'h-1.5 rounded-full transition',
                      i === active ? 'w-6 bg-white/90' : 'w-1.5 bg-white/50',
                    ].join(' ')}
                    type="button"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[2fr_1fr] lg:gap-[28px]">
            <div
              className="relative flex flex-col overflow-hidden rounded-[32px]"
              style={{ aspectRatio: '3/2', minHeight: 0 }}
            >
              <div className="relative h-full w-full">
                {banners.map((b, i) => {
                  let translate = 'translate-x-full opacity-0 z-0';
                  if (i === active) {
                    translate = 'translate-x-0 opacity-100 z-10';
                  } else if (
                    (i < active && !(active === banners.length - 1 && i === 0)) ||
                    (active === 0 && i === banners.length - 1)
                  ) {
                    translate = '-translate-x-full opacity-0 z-0';
                  }

                  const hasText = !!(b.title || b.subtitle || b.button_text);
                  const shouldOverlay = i === active && hasText;
                  const desktopBannerImageSrc = isVideoUrl(b.image_url)
                    ? b.image_url
                    : withSupabaseTransform(b.image_url, 1440, 76);

                  return (
                    <div
                      key={b.id}
                      className={`absolute top-0 left-0 h-full w-full transition-all ${translate}`}
                      style={{ transitionProperty: 'transform, opacity', transitionDuration: '400ms' }}
                      aria-hidden={i !== active}
                    >
                      <Link
                        href={b.href || '#'}
                        className="block h-full w-full"
                        title={b.title || undefined}
                      >
                        <div className="relative h-full w-full overflow-hidden rounded-[32px]">
                          {isVideoUrl(b.image_url) ? (
                            i === active ? (
                              <video
                                className="absolute inset-0 h-full w-full rounded-[32px] object-cover"
                                src={b.image_url}
                                muted
                                playsInline
                                autoPlay
                                loop
                                preload={i === 0 ? 'auto' : 'metadata'}
                              />
                            ) : (
                              <div className="absolute inset-0 bg-black/[0.06]" />
                            )
                          ) : (
                            <Image
                              src={desktopBannerImageSrc}
                              alt={b.title || 'Промо'}
                              fill
                              sizes="(max-width: 1024px) 100vw, 880px"
                              priority={i === 0}
                              fetchPriority={i === 0 ? 'high' : undefined}
                              placeholder="blur"
                              blurDataURL={BLUR_SRC}
                              className="rounded-[32px] object-cover transition-transform duration-500"
                              unoptimized={isExternalUrl(desktopBannerImageSrc)}
                            />
                          )}

                          {shouldOverlay ? (
                            <>
                              <div className="absolute inset-0 bg-black/10" />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
                            </>
                          ) : null}

                          <div className="absolute inset-0 flex flex-col items-start justify-center px-6 py-7 text-white sm:px-9 sm:py-9">
                            {i === active && b.title ? (
                              <h2 className="mb-4 max-w-[95%] text-xl font-extrabold leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] sm:text-2xl md:text-3xl lg:text-[40px]">
                                {b.title}
                              </h2>
                            ) : null}

                            {b.subtitle && i === active ? (
                              <p className="mb-6 max-w-[70%] text-sm font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-lg">
                                {b.subtitle}
                              </p>
                            ) : null}

                            {b.button_text && i === active ? (
                              <span className="inline-flex items-center rounded-[16px] border border-[#bdbdbd] bg-white px-6 py-2 text-base font-bold uppercase text-[#535353] shadow-sm transition hover:bg-[#535353] hover:text-white sm:px-8 sm:py-3">
                                {b.button_text}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}

                {banners.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition hover:bg-white sm:flex"
                      aria-label="Назад"
                      onClick={() => prev(true)}
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
                      className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition hover:bg-white sm:flex"
                      aria-label="Вперед"
                      onClick={() => next(true)}
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
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 grid-rows-2 gap-4 sm:gap-5">
              {desktopCards[0] ? (
                <Link
                  href={desktopCards[0].href || '#'}
                  className="group relative overflow-hidden rounded-[24px]"
                  style={{ aspectRatio: '1 / 1' }}
                  title={desktopCards[0].title || undefined}
                >
                  <Image
                    src={withSupabaseTransform(desktopCards[0].image_url, 520, 72)}
                    alt={desktopCards[0].title || 'Промо'}
                    fill
                    sizes="(max-width: 1280px) 16vw, 260px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    unoptimized={isExternalUrl(withSupabaseTransform(desktopCards[0].image_url, 520, 72))}
                  />
                </Link>
              ) : (
                <div className="rounded-[24px] bg-transparent" />
              )}

              {desktopCards[2] ? (
                <Link
                  href={desktopCards[2].href || '#'}
                  className="group relative overflow-hidden rounded-[24px]"
                  style={{ aspectRatio: '1 / 1' }}
                  title={desktopCards[2].title || undefined}
                >
                  <Image
                    src={withSupabaseTransform(desktopCards[2].image_url, 520, 72)}
                    alt={desktopCards[2].title || 'Промо'}
                    fill
                    sizes="(max-width: 1280px) 16vw, 260px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    unoptimized={isExternalUrl(withSupabaseTransform(desktopCards[2].image_url, 520, 72))}
                  />
                </Link>
              ) : (
                <div className="rounded-[24px] bg-transparent" />
              )}

              {desktopCards[1] ? (
                <Link
                  href={desktopCards[1].href || '#'}
                  className="group relative overflow-hidden rounded-[24px]"
                  style={{ aspectRatio: '1 / 1' }}
                  title={desktopCards[1].title || undefined}
                >
                  <Image
                    src={withSupabaseTransform(desktopCards[1].image_url, 520, 72)}
                    alt={desktopCards[1].title || 'Промо'}
                    fill
                    sizes="(max-width: 1280px) 16vw, 260px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    unoptimized={isExternalUrl(withSupabaseTransform(desktopCards[1].image_url, 520, 72))}
                  />
                </Link>
              ) : (
                <div className="rounded-[24px] bg-transparent" />
              )}

              {desktopCards[3] ? (
                <Link
                  href={desktopCards[3].href || '#'}
                  className="group relative overflow-hidden rounded-[24px]"
                  style={{ aspectRatio: '1 / 1' }}
                  title={desktopCards[3].title || undefined}
                >
                  <Image
                    src={withSupabaseTransform(desktopCards[3].image_url, 520, 72)}
                    alt={desktopCards[3].title || 'Промо'}
                    fill
                    sizes="(max-width: 1280px) 16vw, 260px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    unoptimized={isExternalUrl(withSupabaseTransform(desktopCards[3].image_url, 520, 72))}
                  />
                </Link>
              ) : (
                <div className="rounded-[24px] bg-transparent" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
