import { Metadata } from 'next';
import TermsPageClient from './TermsPageClient';

export const metadata: Metadata = {
  title: 'Пользовательское соглашение',
  description:
    'Пользовательское соглашение интернет-магазина КЛЮЧ К СЕРДЦУ. Условия использования сайта, оформления заказов, оплаты, доставки и возврата товаров в соответствии с законодательством РФ.',
  keywords: [
    'пользовательское соглашение',
    'КЛЮЧ К СЕРДЦУ',
    'условия использования',
    'Краснодар',
    'доставка',
    'возврат товаров',
  ],
  openGraph: {
    title: 'Пользовательское соглашение | КЛЮЧ К СЕРДЦУ',
    description:
      'Пользовательское соглашение интернет-магазина КЛЮЧ К СЕРДЦУ. Условия использования сайта, оформления заказов, оплаты, доставки и возврата товаров.',
    url: 'https://keytoheart.ru/terms',
    siteName: 'КЛЮЧ К СЕРДЦУ',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-terms.jpg',
        width: 1200,
        height: 630,
        alt: 'Пользовательское соглашение КЛЮЧ К СЕРДЦУ',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Пользовательское соглашение | КЛЮЧ К СЕРДЦУ',
    description:
      'Пользовательское соглашение интернет-магазина КЛЮЧ К СЕРДЦУ. Условия использования сайта, оформления заказов, оплаты, доставки и возврата товаров.',
    images: ['https://keytoheart.ru/og-image-terms.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/terms' },
};

export const revalidate = 86400;

export default function TermsPage() {
  return <TermsPageClient />;
}
