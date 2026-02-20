// ✅ Путь: app/policy/page.tsx
import type { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { FAQPage, WebPage } from 'schema-dts';
import PolicyPageClient from '@components/PolicyPageClient';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности',
  description:
    'Политика конфиденциальности интернет-магазина «Ключ к сердцу». Порядок обработки и защиты персональных данных, cookies, права пользователя, сроки хранения.',
  keywords: [
    'политика конфиденциальности',
    'персональные данные',
    '152-ФЗ',
    'cookies',
    'интернет-магазин',
    'Ключ к сердцу',
    'Краснодар',
  ],
  openGraph: {
    title: 'Политика конфиденциальности | Ключ к сердцу',
    description:
      'Как «Ключ к сердцу» обрабатывает и защищает персональные данные, какие права есть у пользователя, как отозвать согласие.',
    url: 'https://keytoheart.ru/policy',
    siteName: 'Ключ к сердцу',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Ключ к сердцу - политика конфиденциальности',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Политика конфиденциальности | Ключ к сердцу',
    description:
      'Порядок обработки и защиты персональных данных интернет-магазина «Ключ к сердцу».',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru/policy' },
};

export const revalidate = 86400;

const faqSchema: FAQPage = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Какие данные собирает «Ключ к сердцу»?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы обрабатываем данные, необходимые для оформления и исполнения заказа (имя, телефон, адрес доставки и т.д.), а также технические данные (cookies, IP-адрес, параметры устройства) для работы сайта и аналитики - при наличии законных оснований и вашего выбора.',
      },
    },
    {
      '@type': 'Question',
      name: 'Как отказаться от рекламной рассылки?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Можно отказаться в любой момент, написав на r.rashevskaya@yandex.ru или позвонив по телефону +7 (988) 603-38-21. Мы обработаем отказ в срок до 3 рабочих дней.',
      },
    },
    {
      '@type': 'Question',
      name: 'Где хранятся персональные данные?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Персональные данные покупателей хранятся и обрабатываются на инфраструктуре, размещенной на территории Российской Федерации. Каталожные данные (товары, категории, изображения) могут храниться на сторонних сервисах и не содержат персональные данные.',
      },
    },
  ],
};

export default function PolicyPage() {
  return (
    <main className="bg-white text-black" aria-label="Политика конфиденциальности">
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Политика конфиденциальности | Ключ к сердцу',
          url: 'https://keytoheart.ru/policy',
          description:
            'Политика конфиденциальности интернет-магазина «Ключ к сердцу»: обработка персональных данных, cookies, права пользователя.',
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
      <JsonLd<FAQPage> item={faqSchema} />
      <PolicyPageClient />
    </main>
  );
}