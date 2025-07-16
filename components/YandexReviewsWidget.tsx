// components/YandexReviewsWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';

export default function YandexReviewsWidget() {
  const [iframeHeight, setIframeHeight] = useState(400);

  useEffect(() => {
    function updateHeight() {
      if (window.innerWidth < 768) {
        setIframeHeight(600); // для мобильных — повыше, чтобы сразу видно было несколько отзывов
      } else {
        setIframeHeight(400); // для десктопа стандартная высота
      }
    }

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <section className="mx-auto max-w-2xl mb-8">
      <h2 className="text-2xl font-bold text-center mb-4"></h2>
      <div className="rounded-2xl overflow-hidden border shadow">
        <iframe
          src="https://yandex.ru/maps-reviews-widget/81940019159?comments"
          style={{
            width: '100%',
            height: iframeHeight,
            border: 'none',
            borderRadius: 18,
            overflow: 'hidden',
          }}
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
