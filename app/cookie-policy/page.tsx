import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { FAQPage, WebPage } from 'schema-dts';
import CookiePolicyPageClient from '@components/CookiePolicyPageClient';

export const metadata: Metadata = {
  title: 'Политика использования cookie | KeyToHeart',
  description: 'Узнайте, как KeyToHeart использует cookie для улучшения вашего опыта. Политика использования cookie в соответствии с законодательством РФ (152-ФЗ).',
  keywords: ['cookie', 'KeyToHeart', 'политика', 'конфиденциальность', 'политика cookie', 'безопасность данных', 'Краснодар'],
  openGraph: {
    title: 'Политика использования cookie | KeyToHeart',
    description: 'Узнайте, как KeyToHeart использует cookie для улучшения вашего опыта.',
    url: 'https://keytoheart.ru/cookie-policy',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-cookie-policy.jpg',
        width: 1200,
        height: 630,
        alt: 'Политика использования cookie KeyToHeart',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Политика использования cookie | KeyToHeart',
    description: 'Узнайте, как KeyToHeart использует cookie для улучшения вашего опыта.',
    images: ['https://keytoheart.ru/og-image-cookie-policy.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/cookie-policy' },
};

export const revalidate = 86400;

const faqSchema: FAQPage = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Какие cookie использует KeyToHeart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы используем необходимые cookie для базовой функциональности, аналитические cookie (Google Analytics, Яндекс.Метрика) для анализа трафика и функциональные cookie для запоминания ваших предпочтений.',
      },
    },
    {
      '@type': 'Question',
      name: 'Можно ли отключить cookie на сайте KeyToHeart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Вы можете отключить аналитические и функциональные cookie через баннер cookie или настройки браузера, но необходимые cookie обязательны для работы сайта.',
      },
    },
  ],
};

export default function CookiePolicyPage() {
  return (
    <main
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white text-black min-h-screen"
      aria-label="Политика использования cookie"
    >
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Политика использования cookie | KeyToHeart',
          url: 'https://keytoheart.ru/cookie-policy',
          description: 'Политика использования cookie интернет-магазина KeyToHeart в соответствии с 152-ФЗ.',
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
      <CookiePolicyPageClient />
    </main>
  );
}