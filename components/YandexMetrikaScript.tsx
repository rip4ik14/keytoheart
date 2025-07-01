'use client';
import Script from 'next/script';

export default function YandexMetrikaScript({ ymId }: { ymId: number }) {
  if (!ymId || ymId <= 0) return null;

  return (
    <>
      <Script
        src="https://mc.yandex.ru/metrika/tag.js"
        strategy="afterInteractive"
      />
      <Script id="yandex-metrika-init" strategy="afterInteractive">
        {`
          ym(${ymId}, 'init', {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            trackHash: true,
            webvisor: true
          });
        `}
      </Script>
      {/* Для no-script трекинга — можно добавить ниже если нужно */}
      {/* 
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${ymId}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
      */}
    </>
  );
}
