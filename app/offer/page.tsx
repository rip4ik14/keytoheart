import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts';
import OfferPageClient from '@components/OfferPageClient';

export const metadata: Metadata = {
  title: 'Публичная оферта',
  description: 'Публичная оферта на получение рекламной рассылки от КЛЮЧ К СЕРДЦУ. Условия обработки персональных данных и отказа от рассылки в соответствии с 152-ФЗ.',
  keywords: ['оферта', 'КЛЮЧ К СЕРДЦУ', 'рассылка', 'персональные данные', 'Краснодар', '152-ФЗ', 'реклама'],
  openGraph: {
    title: 'Публичная оферта | КЛЮЧ К СЕРДЦУ',
    description: 'Публичная оферта на получение рекламной рассылки от КЛЮЧ К СЕРДЦУ.',
    url: 'https://keytoheart.ru/offer',
    siteName: 'КЛЮЧ К СЕРДЦУ',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-offer.jpg',
        width: 1200,
        height: 630,
        alt: 'Публичная оферта КЛЮЧ К СЕРДЦУ',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Публичная оферта | КЛЮЧ К СЕРДЦУ',
    description: 'Публичная оферта на получение рекламной рассылки от КЛЮЧ К СЕРДЦУ.',
    images: ['https://keytoheart.ru/og-image-offer.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/offer' },
};

export const revalidate = 86400;

export default function OfferPage() {
  return (
    <main
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white text-black min-h-screen"
      aria-label="Публичная оферта"
    >
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Публичная оферта | КЛЮЧ К СЕРДЦУ',
          url: 'https://keytoheart.ru/offer',
          description: 'Публичная оферта на получение рекламной рассылки от КЛЮЧ К СЕРДЦУ в соответствии с 152-ФЗ.',
          mainEntity: {
            '@type': 'Organization',
            name: 'КЛЮЧ К СЕРДЦУ',
            url: 'https://keytoheart.ru',
            contactPoint: {
              '@type': 'ContactPoint',
              email: 'info@keytoheart.ru',
              telephone: '+7-988-603-38-21',
              contactType: 'customer service',
            },
          },
        }}
      />
      <OfferPageClient />
    </main>
  );
}
