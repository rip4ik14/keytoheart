// ✅ Путь: app/terms/page.tsx
import type { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts';
import TermsPageClient from './TermsPageClient';

export const metadata: Metadata = {
  title: 'Пользовательское соглашение',
  description:
    'Пользовательское соглашение интернет-магазина «Ключ к сердцу». Условия использования сайта, ответственность, порядок обращения, ссылки на документы.',
  keywords: ['пользовательское соглашение', 'Ключ к сердцу', 'условия использования', 'документы', 'Краснодар'],
  openGraph: {
    title: 'Пользовательское соглашение | Ключ к сердцу',
    description:
      'Условия использования сайта, ответственность сторон и ссылки на правовые документы.',
    url: 'https://keytoheart.ru/terms',
    siteName: 'Ключ к сердцу',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Ключ к сердцу - пользовательское соглашение',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Пользовательское соглашение | Ключ к сердцу',
    description:
      'Условия использования сайта интернет-магазина «Ключ к сердцу».',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru/terms' },
};

export const revalidate = 86400;

export default function TermsPage() {
  return (
    <main className="bg-white text-black" aria-label="Пользовательское соглашение">
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Пользовательское соглашение | Ключ к сердцу',
          url: 'https://keytoheart.ru/terms',
          description:
            'Пользовательское соглашение интернет-магазина «Ключ к сердцу».',
          mainEntity: {
            '@type': 'Organization',
            name: 'Ключ к сердцу',
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
      <TermsPageClient />
    </main>
  );
}