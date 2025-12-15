export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Metadata } from 'next';
import TermsPageClient from './TermsPageClient';

export const metadata: Metadata = {
  title: 'Пользовательское соглашение | KEY TO HEART',
  description:
    'Пользовательское соглашение интернет-магазина KEY TO HEART. Условия использования сайта, оформления заказов, оплаты, доставки и возврата товаров в соответствии с законодательством РФ.',
  keywords: [
    'пользовательское соглашение',
    'KEY TO HEART',
    'условия использования',
    'Краснодар',
    'доставка',
    'возврат товаров',
  ],
  openGraph: {
    title: 'Пользовательское соглашение | KEY TO HEART',
    description:
      'Пользовательское соглашение интернет-магазина KEY TO HEART. Условия использования сайта, оформления заказов, оплаты, доставки и возврата товаров.',
    url: 'https://keytoheart.ru/terms',
    siteName: 'KEY TO HEART',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-terms.jpg',
        width: 1200,
        height: 630,
        alt: 'Пользовательское соглашение KEY TO HEART',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Пользовательское соглашение | KEY TO HEART',
    description:
      'Пользовательское соглашение интернет-магазина KEY TO HEART. Условия использования сайта, оформления заказов, оплаты, доставки и возврата товаров.',
    images: ['https://keytoheart.ru/og-image-terms.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/terms' },
};



export default function TermsPage() {
  return <TermsPageClient />;
}