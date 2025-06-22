'use client';
import { JsonLd } from 'react-schemaorg';
import type { BreadcrumbList, LocalBusiness, WebSite } from 'schema-dts';

export default function SeoScripts() {
  return (
    <>
      <JsonLd
        item={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              name: 'KEY TO HEART',
              url: 'https://keytoheart.ru',
              description:
                'Клубничные букеты, цветы и подарки с доставкой в Краснодаре и до 20 км — от 60 минут, с 8:00 до 22:00.',
            } satisfies WebSite,
            {
              '@type': 'LocalBusiness',
              name: 'KEY TO HEART',
              url: 'https://keytoheart.ru',
              telephone: '+7-988-603-38-21',
              email: 'info@keytoheart.ru',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Краснодар',
                addressRegion: 'Краснодарский край',
                addressCountry: 'RU',
              },
              openingHours: ['Mo-Su 08:00-22:00'],
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ],
                opens: '08:00',
                closes: '22:00',
              },
            } satisfies LocalBusiness,
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Главная',
                  item: 'https://keytoheart.ru',
                },
              ],
            } satisfies BreadcrumbList,
          ],
        }}
      />
      {process.env.YM_ID && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${process.env.YM_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,trackHash:true,webvisor:true});`,
          }}
        />
      )}
    </>
  );
}