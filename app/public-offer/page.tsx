// ✅ Путь: app/public-offer/page.tsx
import type { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts';
import PublicOfferPageClient from '@components/PublicOfferPageClient';

export const metadata: Metadata = {
  title: 'Публичная оферта',
  description:
    'Публичная оферта розничной купли-продажи товаров дистанционным способом интернет-магазина «Ключ к сердцу». Условия заказа, оплаты, доставки, возврата, претензий.',
  keywords: [
    'публичная оферта',
    'дистанционная торговля',
    'купля-продажа',
    'Ключ к сердцу',
    'Краснодар',
    'доставка',
    'возврат',
    'претензии',
  ],
  openGraph: {
    title: 'Публичная оферта | Ключ к сердцу',
    description:
      'Условия дистанционной покупки: заказ, оплата, доставка, возврат, претензии.',
    url: 'https://keytoheart.ru/public-offer',
    siteName: 'Ключ к сердцу',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Ключ к сердцу - публичная оферта',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Публичная оферта | Ключ к сердцу',
    description: 'Публичная оферта интернет-магазина «Ключ к сердцу».',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru/public-offer' },
};

export const revalidate = 86400;

export default function PublicOfferPage() {
  return (
    <main className="bg-white text-black" aria-label="Публичная оферта">
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Публичная оферта | Ключ к сердцу',
          url: 'https://keytoheart.ru/public-offer',
          description:
            'Публичная оферта розничной купли-продажи товаров дистанционным способом интернет-магазина «Ключ к сердцу».',
          mainEntity: {
            '@type': 'Organization',
            name: 'Ключ к сердцу',
            url: 'https://keytoheart.ru',
            contactPoint: {
              '@type': 'ContactPoint',
              email: 'r.rashevskaya@yandex.ru',
              telephone: '+7-988-603-38-21',
              contactType: 'customer service',
            },
          },
        }}
      />
      <PublicOfferPageClient />
    </main>
  );
}