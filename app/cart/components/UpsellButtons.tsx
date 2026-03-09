'use client';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import Image from 'next/image';

interface Props {
  onPostcard: () => void;
  onBalloons: () => void;
}

export default function UpsellButtons({ onPostcard, onBalloons }: Props) {
  const handlePostcardClick = () => {
    onPostcard();
    window.gtag?.('event', 'open_postcard_modal', { event_category: 'cart' });
    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', 'open_postcard_modal');
    }
  };

  const handleBalloonsClick = () => {
    onBalloons();
    window.gtag?.('event', 'open_balloons_modal', { event_category: 'cart' });
    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', 'open_balloons_modal');
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <button
        type="button"
        onClick={handlePostcardClick}
        className="w-full md:w-40 h-28 flex flex-col items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-black"
        aria-label="Добавить открытку"
      >
        <Image
          src="/icons/gift.svg"
          alt="Иконка подарка"
          width={24}
          height={24}
          className="mb-1 text-black"
        />
        <span className="text-xs font-medium text-black">Добавить открытку</span>
      </button>

      <button
        type="button"
        onClick={handleBalloonsClick}
        className="w-full md:w-40 h-28 flex flex-col items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-black"
        aria-label="Добавить шары"
      >
        <Image
          src="/icons/gift.svg"
          alt="Иконка подарка"
          width={24}
          height={24}
          className="mb-1 text-black"
        />
        <span className="text-xs font-medium text-black">Добавить шары</span>
      </button>
    </div>
);
}
