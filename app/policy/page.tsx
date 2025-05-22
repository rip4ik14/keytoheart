import type { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { FAQPage, WebPage } from 'schema-dts';
import PolicyPageClient from '@components/PolicyPageClient';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности | KeyToHeart',
  description:
    'Политика конфиденциальности KeyToHeart. Узнайте, как мы защищаем ваши персональные данные в соответствии с законодательством РФ (152-ФЗ).',
  keywords: ['политика конфиденциальности', 'KeyToHeart', 'персональные данные', '152-ФЗ', 'Краснодар', 'доставка цветов'],
  openGraph: {
    title: 'Политика конфиденциальности | KeyToHeart',
    description: 'Как KeyToHeart защищает ваши персональные данные в соответствии с законодательством РФ.',
    url: 'https://keytoheart.ru/policy',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'KeyToHeart — политика конфиденциальности',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Политика конфиденциальности | KeyToHeart',
    description: 'Как KeyToHeart защищает ваши персональные данные.',
    images: ['https://keytoheart.ru/og-cover.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/policy' },
};

export const revalidate = 86400;

const faqSchema: FAQPage = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Какие персональные данные собирает KeyToHeart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы собираем фамилию, имя, отчество, контактный телефон, адрес электронной почты, адрес доставки, комментарии к заказу, IP-адрес, данные cookies и другие данные, добровольно предоставленные пользователем.',
      },
    },
    {
      '@type': 'Question',
      name: 'Как KeyToHeart защищает мои данные?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы используем шифрование, ограничение доступа, резервное копирование и безопасные протоколы передачи (HTTPS). Все данные хранятся на серверах в Российской Федерации, соответствующих требованиям законодательства РФ.',
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
          name: 'Политика конфиденциальности | KeyToHeart',
          url: 'https://keytoheart.ru/policy',
          description: 'Политика конфиденциальности интернет-магазина KeyToHeart в соответствии с 152-ФЗ.',
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
      <PolicyPageClient />
    </main>
  );
}