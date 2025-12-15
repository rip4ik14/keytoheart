export const dynamic = "force-dynamic";
export const revalidate = 0;


import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { FAQPage, WebPage } from 'schema-dts';
import LoyaltyPageClient from './LoyaltyPageClient';

export const metadata: Metadata = {
  title: 'Программа лояльности • до 15% бонусами | KEY TO HEART',
  description: 'Получайте кешбэк до 15% за каждый заказ на KEY TO HEART и тратьте бонусы на скидки в Краснодаре.',
  keywords: ['программа лояльности', 'KEY TO HEART', 'бонусы', 'кешбэк', 'Краснодар'],
  openGraph: {
    title: 'Программа лояльности | KEY TO HEART',
    description: 'Собирайте бонусы до 15% за заказы в Краснодаре.',
    url: 'https://keytoheart.ru/loyalty',
    siteName: 'KEY TO HEART',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Программа лояльности KEY TO HEART',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Программа лояльности | KEY TO HEART',
    description: 'Кешбэк до 15% за заказы в Краснодаре!',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru/loyalty' },
};



const faqSchema: FAQPage = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Что такое кешбэк в программе лояльности KEY TO HEART?',
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
          name: 'Программа лояльности | KEY TO HEART',
          url: 'https://keytoheart.ru/loyalty',
          description: 'Получайте кешбэк до 15% за заказы.',
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
      <JsonLd<FAQPage> item={faqSchema} />
      <LoyaltyPageClient />
    </main>
  );
}