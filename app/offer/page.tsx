import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts';
import OfferPageClient from '@components/OfferPageClient';

export const metadata: Metadata = {
  title: 'Публичная оферта | KEY TO HEART',
  description: 'Публичная оферта на получение рекламной рассылки от KEY TO HEART. Условия обработки персональных данных и отказа от рассылки в соответствии с 152-ФЗ.',
  keywords: ['оферта', 'KEY TO HEART', 'рассылка', 'персональные данные', 'Краснодар', '152-ФЗ', 'реклама'],
  openGraph: {
    title: 'Публичная оферта | KEY TO HEART',
    description: 'Публичная оферта на получение рекламной рассылки от KEY TO HEART.',
    url: 'https://keytoheart.ru/offer',
    siteName: 'KEY TO HEART',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-offer.jpg',
        width: 1200,
        height: 630,
        alt: 'Публичная оферта KEY TO HEART',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Публичная оферта | KEY TO HEART',
    description: 'Публичная оферта на получение рекламной рассылки от KEY TO HEART.',
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
          name: 'Публичная оферта | KEY TO HEART',
          url: 'https://keytoheart.ru/offer',
          description: 'Публичная оферта на получение рекламной рассылки от KEY TO HEART в соответствии с 152-ФЗ.',
          mainEntity: {
            '@type': 'Organization',
            name: 'KEY TO HEART',
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