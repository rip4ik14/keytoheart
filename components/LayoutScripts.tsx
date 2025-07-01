'use client'

import { JsonLd } from 'react-schemaorg'
import type { BreadcrumbList, LocalBusiness, WebSite } from 'schema-dts'
import YandexMetrikaScript from './YandexMetrikaScript'
import { YM_ID } from '@/utils/ym'

export default function LayoutScripts() {
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
      {YM_ID && <YandexMetrikaScript ymId={YM_ID} />}
    </>
  )
}
