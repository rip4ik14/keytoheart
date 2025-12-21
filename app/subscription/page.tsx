import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage, Service, Offer, QuantitativeValue } from 'schema-dts';
import SubscriptionPageClient from '@components/SubscriptionPageClient';

export const metadata: Metadata = {
  title: 'Premium Подписка – 20% скидка на клубнику в шоколаде и цветы',
  description:
    'Станьте членом Premium Клуба KEY TO HEART и получите 20% скидку на все товары, удвоенные бонусы и приоритетную доставку в Краснодаре. Ежемесячно или ежегодно – выбирайте план!',
  keywords: ['подписка KEY TO HEART', 'скидка 20%', 'премиум клуб', 'доставка клубники Краснодар'],
  openGraph: {
    title: 'Premium Подписка – Экономьте 20% на сладкие подарки',
    description: 'Получите постоянную скидку, эксклюзивы и бонусы. Подписка от 499₽/мес с доставкой в Краснодаре.',
    url: 'https://keytoheart.ru/subscription',
    images: [{ url: '/og-subscription.webp', width: 1200, height: 630, alt: 'Premium Подписка KEY TO HEART' }],
    type: 'website',
  },
  alternates: { canonical: 'https://keytoheart.ru/subscription' },
};

export const revalidate = 86400;

const webPageSchema: WebPage = {
  '@type': 'WebPage',
  name: 'Premium Подписка | KEY TO HEART',
  url: 'https://keytoheart.ru/subscription',
  description:
    'Подписка KEY TO HEART: 20% скидка на все товары, удвоенные бонусы, приоритетная доставка и эксклюзивы.',
};

const oneMonth: QuantitativeValue = {
  '@type': 'QuantitativeValue',
  value: 1,
  // UN/CEFACT code for month
  unitCode: 'MON',
};

const serviceSchema: Service & { offers: Offer } = {
  '@type': 'Service',
  name: 'KEY TO HEART Premium Membership',
  description: 'Премиум-подписка с постоянной скидкой и привилегиями.',
  areaServed: { '@type': 'City', name: 'Краснодар' },
  offers: {
    '@type': 'Offer',
    price: '499',
    priceCurrency: 'RUB',
    url: 'https://keytoheart.ru/subscription',
    eligibleDuration: oneMonth, // <-- корректный тип
  },
};

export default function SubscriptionPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white text-black min-h-screen">
      <JsonLd<WebPage> item={webPageSchema} />
      <JsonLd<Service> item={serviceSchema} />
      <SubscriptionPageClient />
    </main>
  );
}
