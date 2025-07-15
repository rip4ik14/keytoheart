/* -------------------------------------------------------------------------- */
/*  О нас – SEO‑правка «клубника в шоколаде»                                   */
/* -------------------------------------------------------------------------- */

import { Metadata } from 'next';
import { JsonLd, Organization } from 'react-schemaorg';
import AboutContent from '@components/AboutContent';
import Link from 'next/link';

export const metadata: Metadata = {
  title:
    'О нас | KEY TO HEART — клубника в шоколаде, букеты и цветы в Краснодаре',
  description:
    'История мастерской KEY TO HEART. Мы создаём сладкие эмоции: клубника в шоколаде, клубничные букеты и свежие цветы с доставкой по Краснодару.',
  keywords: ['клубника в шоколаде', 'о нас', 'KEY TO HEART', 'букеты Краснодар'],
  openGraph: {
    title: 'О нас | KEY TO HEART',
    description:
      'Узнайте, как в KEY TO HEART превращают клубнику в шоколаде и цветы в незабываемые подарки.',
    url: 'https://keytoheart.ru/about',
    siteName: 'KEY TO HEART',
    images: [
      {
        url: 'https://keytoheart.ru/images/about-banner.jpg',
        width: 1200,
        height: 600,
        alt: 'KEY TO HEART — клубника в шоколаде и цветочные букеты',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'О нас | KEY TO HEART',
    description:
      'История KEY TO HEART — студии сладких эмоций в Краснодаре: клубника в шоколаде, букеты и цветы.',
    images: ['https://keytoheart.ru/images/about-banner.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/about' },
};

export default function AboutPage() {
  return (
    <main className="bg-white text-black" aria-label="О нас">
      <JsonLd<Organization>
        item={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'KEY TO HEART',
          url: 'https://keytoheart.ru',
          logo: 'https://keytoheart.ru/favicon.ico',
          sameAs: [
            'https://www.instagram.com/keytoheart.ru/',
            'https://t.me/keytoheart',
          ],
          description:
            'KEY TO HEART — студия сладких эмоций. Клубника в шоколаде, букеты и подарки с доставкой по Краснодару.',
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+7-988-603-38-21',
            contactType: 'customer service',
            areaServed: 'RU',
            availableLanguage: 'Russian',
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Улица Героев‑Разведчиков, 17/1',
            addressLocality: 'Краснодар',
            addressCountry: 'RU',
          },
          openingHours: 'Mo-Su 09:00-22:00',
        }}
      />

      <section>
        <AboutContent />
      </section>

      <section className="container mx-auto px-4 py-8 text-center">
        <p className="text-sm">
          Узнайте, как мы защищаем ваши данные в нашей{' '}
          <Link
            href="/policy"
            className="underline hover:text-gray-600 transition-colors"
          >
            Политике конфиденциальности
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
