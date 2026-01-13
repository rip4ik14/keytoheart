'use client';

import { useState, useEffect } from 'react';
import PromoGridClient from './PromoGridClient';
import { PromoBlock } from '@/types/promo';

function PromoGridSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[2fr_1fr] lg:gap-[28px]">
        {/* баннер */}
        <div
          className="relative overflow-hidden rounded-[32px] bg-black/[0.04]"
          style={{ aspectRatio: '3/2' }}
        />
        {/* карточки справа (только lg) */}
        <div className="hidden lg:grid h-full grid-cols-2 grid-rows-2 gap-[20px] min-h-[320px]">
          <div className="rounded-[24px] bg-black/[0.04]" />
          <div className="rounded-[24px] bg-black/[0.04]" />
          <div className="rounded-[24px] bg-black/[0.04]" />
          <div className="rounded-[24px] bg-black/[0.04]" />
        </div>
      </div>

      <div className="mt-4 sm:mt-6 mb-2 sm:mb-4 text-center">
        <div className="mx-auto h-4 w-[min(520px,90%)] rounded-full bg-black/[0.04]" />
      </div>
    </section>
  );
}

export default function PromoGridWrapper({
  banners = [],
  cards = [],
}: {
  banners?: PromoBlock[];
  cards?: PromoBlock[];
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) return <PromoGridSkeleton />;

  return <PromoGridClient banners={banners} cards={cards} />;
}
