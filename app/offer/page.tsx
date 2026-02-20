import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts';
import OfferPageClient from '@components/OfferPageClient';

export const metadata: Metadata = {
  title: 'Согласие на рекламную рассылку',
  description:
    'Условия предоставления согласия на получение рекламных сообщений от интернет-магазина «Ключ к сердцу» и порядок отказа от рассылки.',
  keywords: ['рассылка', 'согласие', 'Ключ к сердцу', 'реклама', 'персональные данные', 'отписка'],
  openGraph: {
    title: 'Согласие на рассылку | Ключ к сердцу',
    description: 'Условия рекламной рассылки и порядок отказа от неё.',
    url: 'https://keytoheart.ru/offer',
    siteName: 'Ключ к сердцу',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-offer.jpg',
        width: 1200,
        height: 630,
        alt: 'Согласие на рассылку Ключ к сердцу',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Согласие на рассылку | Ключ к сердцу',
    description: 'Условия рекламной рассылки и порядок отказа от неё.',
    images: ['https://keytoheart.ru/og-image-offer.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/offer' },
};

export const revalidate = 86400;

export default function OfferPage() {
  return (
    <main
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white text-black min-h-screen"
      aria-label="Согласие на рекламную рассылку"
    >
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Согласие на рассылку | Ключ к сердцу',
          url: 'https://keytoheart.ru/offer',
          description:
            'Условия предоставления согласия на получение рекламных сообщений от интернет-магазина «Ключ к сердцу» и порядок отказа от рассылки.',
          mainEntity: {
            '@type': 'Organization',
            name: 'Ключ к сердцу',
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