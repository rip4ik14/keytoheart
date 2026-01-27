import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { FAQPage, Service, WebPage } from 'schema-dts';
import DostavkaPageClient from '@components/DostavkaPageClient';

export const metadata: Metadata = {
  title: 'Доставка клубничных букетов в Краснодаре',
  description: 'Условия доставки клубничных букетов и цветов по Краснодару от КЛЮЧ К СЕРДЦУ. Доставка в день заказа, свежесть гарантирована.',
  keywords: [
    'доставка букетов Краснодар',
    'клубничные букеты',
    'КЛЮЧ К СЕРДЦУ',
    'бесплатная доставка',
    'доставка цветов',
    'доставка в день заказа',
    'Краснодар',
    'клубника в шоколаде Краснодар',
  ],
  openGraph: {
    title: 'Доставка клубничных букетов в Краснодаре | КЛЮЧ К СЕРДЦУ',
    description: 'Быстрая доставка клубничных букетов и цветов по Краснодару с КЛЮЧ К СЕРДЦУ.',
    url: 'https://keytoheart.ru/dostavka',
    siteName: 'КЛЮЧ К СЕРДЦУ',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-dostavka.jpg',
        width: 1200,
        height: 630,
        alt: 'Доставка клубничных букетов КЛЮЧ К СЕРДЦУ',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Доставка клубничных букетов в Краснодаре | КЛЮЧ К СЕРДЦУ',
    description: 'Быстрая доставка букетов и цветов по Краснодару. Заказывайте 24/7!',
    images: ['https://keytoheart.ru/og-image-dostavka.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/dostavka' },
};

export const revalidate = 86400;

const webPageSchema: WebPage = {
  '@type': 'WebPage',
  name: 'Доставка клубничных букетов в Краснодаре | КЛЮЧ К СЕРДЦУ',
  url: 'https://keytoheart.ru/dostavka',
  description: 'Условия доставки клубничных букетов и цветов по Краснодару от КЛЮЧ К СЕРДЦУ.',
  datePublished: '2025-05-20',
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
};

const deliverySchema: Service = {
  '@type': 'Service',
  serviceType: 'DeliveryService',
  name: 'Доставка КЛЮЧ К СЕРДЦУ',
  description: 'Доставка клубничных букетов и цветов по Краснодару и пригороду с 08:00 до 21:00 ежедневно, включая самовывоз и курьерскую доставку.',
  areaServed: {
    '@type': 'City',
    name: 'Краснодар',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Краснодарский край',
      addressCountry: 'RU',
    },
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'RUB',
    eligibleTransactionVolume: {
      '@type': 'PriceSpecification',
      minPrice: '2000',
      priceCurrency: 'RUB',
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '300',
        currency: 'RUB',
      },
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressRegion: 'Краснодарский край',
      },
    },
  },
};

const faqSchema: FAQPage = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Сколько стоит доставка клубничных букетов в Краснодаре?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Доставка по Краснодару рассчитывается по тарифам курьерской службы YandexGO',
      },
    },
    {
      '@type': 'Question',
      name: 'Как быстро доставляют букеты КЛЮЧ К СЕРДЦУ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы доставляем заказы в течение 1–2 часов с момента подтверждения. Также возможна доставка в день заказа при оформлении до 18:00.',
      },
    },
    {
      '@type': 'Question',
      name: 'Можно ли забрать букет самостоятельно?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Да, вы можете забрать заказ в нашей мастерской в Краснодаре. Уточните адрес и время у менеджера.',
      },
    },
  ],
};

export default function DostavkaPage() {
  return (
    <main
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white text-black min-h-screen"
      aria-label="Информация о доставке"
    >
      <JsonLd<WebPage> item={webPageSchema} />
      <JsonLd<Service> item={deliverySchema} />
      <JsonLd<FAQPage> item={faqSchema} />
      <DostavkaPageClient />
    </main>
  );
}
