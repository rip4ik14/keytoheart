'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PromoBlock } from '@/types/promo';

const BLUR_SRC = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z/C/HwMDAwMjIxEABAMAATN4A+QAAAAASUVORK5CYII=';

// SSR-баннер будет виден только до первой гидрации
export default function PromoBannerServer({ banner }: { banner: PromoBlock }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Скрываем баннер сразу после гидрации
    setVisible(false);
  }, []);

  if (!banner || !visible) return null;

  return (
    <div className="relative overflow-hidden rounded-[32px] flex flex-col" style={{ aspectRatio: '3/2', minHeight: 0 }}>
      <Link href={banner.href || '#'} className="block h-full w-full" title={banner.title}>
        <div className="relative w-full h-full rounded-[32px] overflow-hidden">
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            sizes="(max-width: 1024px) 100vw, 880px"
            priority
            fetchPriority="high"
            placeholder="blur"
            blurDataURL={BLUR_SRC}
            className="object-cover rounded-[32px]"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col justify-center items-start px-6 sm:px-9 py-7 sm:py-9 text-white">
            <h1 className="mb-4 text-xl sm:text-2xl md:text-3xl lg:text-[40px] leading-tight font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] max-w-[95%]">
              {banner.title}
            </h1>
            {banner.subtitle && (
              <p className="mb-6 text-sm sm:text-lg font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] max-w-[70%]">
                {banner.subtitle}
              </p>
            )}
            {banner.button_text && (
              <span className="inline-flex items-center border border-[#bdbdbd] rounded-[16px] px-6 py-2 sm:px-8 sm:py-3 font-bold text-base uppercase bg-white text-[#535353] shadow-sm transition hover:bg-[#535353] hover:text-white">
                {banner.button_text}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
