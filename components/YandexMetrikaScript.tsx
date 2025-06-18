// ✅ Путь: components/YandexMetrikaScript.tsx
'use client';

import Script from 'next/script';

interface YandexMetrikaScriptProps {
  ymId: number;
}

export default function YandexMetrikaScript({ ymId }: YandexMetrikaScriptProps) {
  return (
    <Script
      id="ym"
      data-nosnippet
      strategy="afterInteractive"
      src="https://mc.yandex.ru/metrika/tag.js"
      onLoad={() => {
        if (typeof window.ym === 'function') {
          // @ts-ignore: window.ym accepts object init params
          window.ym(ymId, 'init', {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            trackHash: true,
            webvisor: true,
          });
        } else {
          console.error('Yandex Metrika is not loaded');
        }
      }}
      // Log if the external script fails to load
      onError={() =>
        console.error('Failed to load Yandex.Metrica script')
      }
      />
  );
}
