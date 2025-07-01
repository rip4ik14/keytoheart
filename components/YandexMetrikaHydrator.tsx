// components/YandexMetrikaHydrator.tsx
'use client';

import Script from 'next/script';
import { YM_ID } from '@/utils/ym';

export default function YandexMetrikaHydrator() {
  if (!YM_ID || typeof YM_ID !== 'number' || YM_ID <= 0 || Number.isNaN(YM_ID)) return null;

  return (
    <>
      <Script
        id="yandex-metrika"
        src="https://mc.yandex.ru/metrika/tag.js"
        strategy="afterInteractive"
      />
      <Script id="yandex-metrika-init" strategy="afterInteractive">
        {`
          try {
            ym(${YM_ID}, 'init', {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              trackHash:true,
              webvisor:true
            });
          } catch (e) { }
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YM_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
