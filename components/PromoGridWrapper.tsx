'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { PromoBlock } from '@/types/promo';

const PromoGridClient = dynamic(() => import('./PromoGridClient'), { ssr: false });

export default function PromoGridWrapper({
  banners,
  cards,
}: {
  banners: PromoBlock[];
  cards: PromoBlock[];
}) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  if (!banners.length && !cards.length) return null;

  const mainBanner = banners[0];

  return (
    <section className="mx-auto mt-8 sm:mt-10 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="promo-grid-title">
      <h2 id="promo-grid-title" className="sr-only">Промо-блоки</h2>
      {!hydrated && mainBanner && (
        <div className="relative w-full aspect-[3/2] rounded-2xl lg:rounded-3xl overflow-hidden mb-4 shadow-lg animate-fadeIn">
          <Link href={mainBanner.href || '#'} title={mainBanner.title} className="block h-full w-full">
            <Image
              src={mainBanner.image_url || '/main-lcp-banner.webp'} // Лучше mainBanner.image_url!
              alt={mainBanner.title}
              fill
              priority
              fetchPriority="high"
              decoding="async"
              sizes="(max-width:1024px) 100vw, 66vw"
              quality={75}
              className="object-cover rounded-2xl lg:rounded-3xl"
              style={{ aspectRatio: '3 / 2' }}
            />
            <div className="absolute inset-0 bg-black/20 rounded-2xl lg:rounded-3xl" />
            <div className="absolute inset-0 flex flex-col justify-center items-start px-4 py-4 sm:px-12 lg:px-16 sm:py-8 lg:py-12 text-white text-left">
              <h2 className="mb-2 text-lg xs:text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow max-w-[95vw] sm:max-w-[80vw] leading-tight sm:mb-3 lg:mb-4">
                {mainBanner.title}
              </h2>
              {mainBanner.subtitle && (
                <p className="mb-3 text-sm xs:text-base sm:text-lg lg:text-xl text-white/90 drop-shadow max-w-[95vw] sm:max-w-[80vw] sm:mb-4 lg:mb-6">
                  {mainBanner.subtitle}
                </p>
              )}
              {mainBanner.button_text && (
                <span className="inline-flex items-center border border-[#bdbdbd] rounded-lg px-4 py-2 font-bold text-sm uppercase bg-white text-[#535353] shadow hover:bg-[#535353] hover:text-white transition-all">
                  {mainBanner.button_text}
                </span>
              )}
            </div>
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 pointer-events-none">
                {banners.map((_, idx) => (
                  <span key={idx} className={`block w-2 h-2 rounded-full ${idx === 0 ? 'bg-white/90' : 'bg-white/40'}`} />
                ))}
              </div>
            )}
          </Link>
        </div>
      )}
      {/* После гидратации показываем уже весь Swiper и остальные баннеры, как раньше */}
      {hydrated && <PromoGridClient banners={banners} cards={cards} />}
    </section>
  );
}
