import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { FAQPage, WebPage } from 'schema-dts';
import LoyaltyPageClient from './LoyaltyPageClient';

export const metadata: Metadata = {
  title: 'Программа лояльности • до 15% бонусами | KeyToHeart',
  description:
    'Получайте кешбэк до 15% за каждый заказ на KeyToHeart и оплачивайте им до 15% следующих покупок.',
  keywords: ['программа лояльности', 'KeyToHeart', 'бонусы', 'кешбэк', 'Краснодар'],
  openGraph: {
    title: 'Программа лояльности | KeyToHeart',
    description: 'Получайте кешбэк до 15% за заказы.',
    url: 'https://keytoheart.ru/loyalty',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'Программа лояльности KeyToHeart',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Программа лояльности | KeyToHeart',
    description: 'Получайте кешбэк до 15% за заказы.',
    images: ['https://keytoheart.ru/og-cover.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/loyalty' },
};

export const revalidate = 86400;

const faqSchema: FAQPage = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Что такое кешбэк в программе лояльности KeyToHeart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Кешбэк – это возврат бонусных баллов на ваш счёт. 1 балл = 1 ₽. Вы получаете до 15% от суммы заказа в зависимости от уровня.',
      },
    },
    {
      '@type': 'Question',
      name: 'Как стать участником программы лояльности?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Вы автоматически становитесь участником при первом заказе.',
      },
    },
  ],
};

export default function LoyaltyPage() {
  return (
    <main aria-label="Программа лояльности">
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Программа лояльности | KeyToHeart',
          url: 'https://keytoheart.ru/loyalty',
          description: 'Получайте кешбэк до 15% за заказы.',
          mainEntity: {
            '@type': 'Organization',
            name: 'KeyToHeart',
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
      <JsonLd<FAQPage> item={faqSchema} />
      <LoyaltyPageClient />
    </main>
  );
}