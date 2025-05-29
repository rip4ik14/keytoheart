import { Metadata } from 'next';
import { JsonLd, Organization } from 'react-schemaorg';
import AboutContent from '@components/AboutContent';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'О нас | KeyToHeart — Клубничные букеты и цветы в Краснодаре',
  description: 'История KeyToHeart — студия сладких эмоций. Создаём букеты из клубники в шоколаде и свежих цветов с доставкой по Краснодару.',
  keywords: ['о нас', 'KeyToHeart', 'клубничные букеты'],
  openGraph: {
    title: 'О нас | KeyToHeart',
    description: 'Узнайте историю KeyToHeart — как мы создаём сладкие и цветочные эмоции.',
    url: 'https://keytoheart.ru/about',
    siteName: 'KeyToHeart',
    images: [
      {
        url: '/images/about-banner.jpg', // Изменили на локальный путь
        width: 1200,
        height: 600,
        alt: 'KeyToHeart — клубника в шоколаде и цветочные букеты',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'О нас | KeyToHeart',
    description: 'История KeyToHeart — студия сладких эмоций в Краснодаре.',
    images: ['/images/about-banner.jpg'], // Изменили на локальный путь
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
          name: 'KeyToHeart',
          url: 'https://keytoheart.ru',
          logo: 'https://keytoheart.ru/favicon.ico',
          sameAs: ['https://t.me/keytoheart'],
          description: 'KeyToHeart — студия сладких эмоций. Букеты и подарки с доставкой по Краснодару.',
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+7-918-123-45-67',
            contactType: 'customer service',
            areaServed: 'RU',
            availableLanguage: 'Russian',
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Улица Героев-Разведчиков, 17/1',
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