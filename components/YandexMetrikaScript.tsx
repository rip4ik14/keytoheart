// components/YandexMetrikaScript.tsx
'use client';

import Script from 'next/script';

interface YandexMetrikaScriptProps {
  ymId: number;
}

export default function YandexMetrikaScript({ ymId }: YandexMetrikaScriptProps) {
  if (!ymId) return null;

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
            webvisor: true,
          });
        `}
      </Script>
    </>
  );
}
