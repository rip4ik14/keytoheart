// ✅ Путь: app/cookie-policy/page.tsx
import type { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts';
import CookiePolicyPageClient from '@components/CookiePolicyPageClient';

export const metadata: Metadata = {
  title: 'Политика cookies',
  description:
    'Политика использования cookies интернет-магазина «Ключ к сердцу»: какие cookies применяются, как управлять настройками и как связаться с нами.',
  keywords: ['cookies', 'политика cookies', 'Ключ к сердцу', 'персональные данные', 'аналитика'],
  openGraph: {
    title: 'Политика cookies | Ключ к сердцу',
    description: 'Какие cookies мы используем и как управлять настройками.',
    url: 'https://keytoheart.ru/cookie-policy',
    siteName: 'Ключ к сердцу',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Ключ к сердцу - политика cookies',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Политика cookies | Ключ к сердцу',
    description: 'Какие cookies мы используем и как управлять настройками.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru/cookie-policy' },
};

export const revalidate = 86400;

export default function CookiePolicyPage() {
  return (
    <main className="bg-white text-black" aria-label="Политика использования cookies">
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Политика cookies | Ключ к сердцу',
          url: 'https://keytoheart.ru/cookie-policy',
          description:
            'Политика использования cookies интернет-магазина «Ключ к сердцу»: типы cookies, управление, контакты.',
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
      <CookiePolicyPageClient />
    </main>
  );
}