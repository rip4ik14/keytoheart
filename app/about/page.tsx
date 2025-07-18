/* -------------------------------------------------------------------------- */
/*  О нас (About) – SEO‑clean + JSON‑LD Organization                          */
/*  Версия: 2025‑07‑18                                                        */
/* -------------------------------------------------------------------------- */

import { Metadata } from 'next';
import { JsonLd, Organization } from 'react-schemaorg';
import AboutContent from '@components/AboutContent';
import Link from 'next/link';

export const metadata: Metadata = {
  title:
    'О нас | KEY TO HEART — клубника в шоколаде, букеты и цветы в Краснодаре',
  description:
    'История мастерской KEY TO HEART. Мы создаём клубнику в бельгийском шоколаде, букеты и комбо‑наборы с доставкой по Краснодару за 60 минут. Фото перед отправкой, бесплатная открытка, оплата онлайн.',
  alternates: { canonical: 'https://keytoheart.ru/about' },
  openGraph: {
    type: 'website',
    url: 'https://keytoheart.ru/about',
    siteName: 'KEY TO HEART',
    title: 'О нас | KEY TO HEART',
    description:
      'Узнайте, как в KEY TO HEART превращают клубнику в шоколаде и цветы в незабываемые подарки. Доставка по Краснодару 60 минут, фото перед отправкой.',
    images: [
      {
        url: 'https://keytoheart.ru/images/og-about.webp',
        width: 1200,
        height: 630,
        alt: 'KEY TO HEART — клубника в шоколаде и цветочные букеты',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'О нас | KEY TO HEART',
    description:
      'История KEY TO HEART — студии сладких эмоций в Краснодаре: клубника в шоколаде, букеты и цветы с доставкой 60 мин.',
    images: ['https://keytoheart.ru/images/og-about.webp'],
  },
};

export default function AboutPage() {
  return (
    <main className="bg-white text-black" aria-label="О нас">
      {/* --- JSON‑LD Organization --- */}
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
            'KEY TO HEART — студия сладких эмоций. Клубника в шоколаде, букеты и комбо‑наборы с доставкой по Краснодару за 60 минут.',
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+7-988-603-38-21',
            contactType: 'customer service',
            areaServed: 'RU',
            availableLanguage: 'Russian',
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'ул. Героев‑Разведчиков, 17/1',
            addressLocality: 'Краснодар',
            addressCountry: 'RU',
          },
          openingHours: 'Mo-Su 09:00-22:00',
        }}
      />

      {/* --- Основное контентное наполнение --- */}
      <AboutContent />

      {/* --- Линк на политику --- */}
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
