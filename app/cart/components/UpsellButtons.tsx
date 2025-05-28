'use client';

import Image from 'next/image'; // Добавляем импорт Image

interface Props {
  onPostcard: () => void;
  onBalloons: () => void;
}

export default function UpsellButtons({ onPostcard, onBalloons }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <button
        type="button"
        onClick={() => {
          onPostcard();
          window.gtag?.('event', 'open_postcard_modal', { event_category: 'cart' });
          window.ym?.(96644553, 'reachGoal', 'open_postcard_modal');
        }}
        className="w-full md:w-40 h-28 flex flex-col items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-black"
        aria-label="Добавить открытку"
      >
        <Image
          src="/icons/gift.svg" // Путь к иконке в папке /public/icons
          alt="Иконка подарка"
          width={24} // Устанавливаем ширину (аналог h-6)
          height={24} // Устанавливаем высоту (аналог w-6)
          className="mb-1 text-black" // Сохраняем стили, хотя text-black не влияет на SVG в Image
        />
        <span className="text-xs font-medium text-black">Добавить открытку</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onBalloons();
          window.gtag?.('event', 'open_balloons_modal', { event_category: 'cart' });
          window.ym?.(96644553, 'reachGoal', 'open_balloons_modal');
        }}
        className="w-full md:w-40 h-28 flex flex-col items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-black"
        aria-label="Добавить шары"
      >
        <Image
          src="/icons/gift.svg" // Путь к иконке в папке /public/icons
          alt="Иконка подарка"
          width={24} // Устанавливаем ширину (аналог h-6)
          height={24} // Устанавливаем высоту (аналог w-6)
          className="mb-1 text-black" // Сохраняем стили
        />
        <span className="text-xs font-medium text-black">Добавить шары</span>
      </button>
    </div>
  );
}