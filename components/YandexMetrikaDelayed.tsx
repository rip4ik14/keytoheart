'use client';

import { useEffect } from 'react';
import { YM_ID } from '@/utils/ym';

export default function YandexMetrikaDelayed() {
  useEffect(() => {
    if (!YM_ID) return;

    const onLoad = () => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://mc.yandex.ru/metrika/tag.js';
      document.head.appendChild(script);

      script.onload = () => {
        // @ts-ignore – тип ym может отличаться
        window.ym && window.ym(Number(YM_ID), 'init', {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          trackHash: true,
          webvisor: true,
        });
      };
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);

  return null;
}
