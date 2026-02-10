// components/YandexReviewsWidget.tsx
import React from 'react';

export default function YandexReviewsWidget() {
  return (
    <section className="mx-auto max-w-2xl mb-8">
      <h2 className="text-2xl font-bold text-center mb-4"></h2>
      <div className="rounded-2xl overflow-hidden border shadow">
        <iframe
          src="https://yandex.ru/maps-reviews-widget/81940019159?comments"
          style={{ width: '100%', border: 'none', borderRadius: 18, overflow: 'hidden' }}
          className="h-[600px] md:h-[400px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Отзывы на Яндекс.Картах"
        />
      </div>
      <div className="text-center text-xs text-gray-400 mt-2">
        <a
          href="https://yandex.ru/maps/org/klyuch_k_serdtsu/81940019159/reviews/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Все отзывы и рейтинг на Яндекс.Картах
        </a>
      </div>
    </section>
  );
}
