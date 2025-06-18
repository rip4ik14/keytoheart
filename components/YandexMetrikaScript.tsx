// components/YandexMetrikaScript.tsx
'use client';

import Script from 'next/script';

interface YandexMetrikaScriptProps {
  ymId: number;
}

export default function YandexMetrikaScript({ ymId }: YandexMetrikaScriptProps) {
  return (
    <Script id="yandex-metrika" strategy="afterInteractive">
      {`
        (function(m,e,t,r,i,k,a){
          m[i]=m[i]||function(){
            (m[i].a=m[i].a||[]).push(arguments)
          };
          m[i].l=1*new Date();
          k=e.createElement(t);
          a=e.getElementsByTagName(t)[0];
          k.async=1;
          k.src=r;
          a.parentNode.insertBefore(k,a);
        })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym(${ymId}, "init", {
          clickmap:true,
          trackLinks:true,
          accurateTrackBounce:true,
          trackHash:true,
          webvisor:true
        });
      `}
    </Script>
  );
}
