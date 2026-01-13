'use client';

import Link from 'next/link';
import { ExternalLink, Star } from 'lucide-react';

type Props = {
  ratingValue?: number;   // например 4.93
  ratingCount?: number;   // например 2800
  shopUrl?: string;       // flowwow shop url
  className?: string;
  anchorId?: string;      // чтобы якорь работал
};

function formatRatingCount(n: number) {
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n >= 1000) return 'более 2800 оценок'; // как ты просил, без точных фото и без перечислений
  return `${n} оценок`;
}

export default function FlowwowReviewsWidget({
  ratingValue = 4.93,
  ratingCount = 2800,
  shopUrl = 'https://flowwow.com/shop/key-to-heart/',
  className = '',
  anchorId = 'flowwow-reviews',
  }: Props) {
  const stars = 5;

  return (
    <section
      id={anchorId}
      aria-label="Отзывы на Flowwow"
      className={`mx-auto max-w-7xl px-4 ${className}`}
    >
      <div
        className="
          rounded-2xl border border-gray-200 bg-white
          shadow-[0_8px_24px_rgba(0,0,0,0.06)]
          px-4 py-4 sm:px-6 sm:py-5
        "
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-semibold text-black">
              Отзывы о КЛЮЧ К СЕРДЦУ на Flowwow
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-2xl sm:text-3xl font-bold leading-none text-black">
                {String(ratingValue).replace('.', ',')}
              </span>

              <div className="flex items-center gap-0.5" aria-label={`Рейтинг ${ratingValue} из 5`}>
                {Array.from({ length: stars }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-current text-black"
                    strokeWidth={0}
                  />
                ))}
              </div>

              <span className="text-sm text-gray-600">
                {formatRatingCount(ratingCount)}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-700">
              Реальные отзывы и фото покупателей находятся на Flowwow.
            </p>

            <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
              Мы не копируем отзывы автоматически с Flowwow, чтобы соблюдать правила площадки. Здесь - быстрый переход к источнику.
            </div>
          </div>

          <Link
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex shrink-0 items-center gap-2
              rounded-full border border-gray-200 bg-white
              px-4 py-2 text-sm font-medium text-black
              hover:bg-gray-50 transition
            "
            aria-label="Открыть отзывы на Flowwow"
          >
            Открыть
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
