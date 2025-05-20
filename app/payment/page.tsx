import type { Metadata } from 'next';
import Script from 'next/script';
import PaymentPageClient from '@components/PaymentPageClient';

export const metadata: Metadata = {
  title: 'Оплата | KeyToHeart',
  description: 'Информация об оплате заказов KeyToHeart: СБП, онлайн по карте, наличные в мастерской, иностранная карта и безнал для юрлиц. Всё прозрачно и удобно.',
  keywords: ['оплата', 'KeyToHeart', 'Краснодар', 'клубничные букеты', 'доставка', 'СБП', 'онлайн-оплата'],
  openGraph: {
    title: 'Оплата | KeyToHeart',
    description: 'Информация об оплате заказов KeyToHeart: СБП, онлайн по карте, наличные и другие способы.',
    url: 'https://keytoheart.ru/payment',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-payment.jpg',
        width: 1200,
        height: 630,
        alt: 'Оплата заказов KeyToHeart',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Оплата | KeyToHeart',
    description: 'Информация об оплате заказов KeyToHeart: СБП, онлайн по карте, наличные и другие способы.',
    images: ['https://keytoheart.ru/og-image-payment.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/payment' },
};

const schemaPayment = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Какие способы оплаты доступны в KeyToHeart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы принимаем оплату через СБП (по QR-коду), онлайн по ссылке (CloudPayments), наличными в мастерской, иностранными картами и по реквизитам для юрлиц.',
      },
    },
    {
      '@type': 'Question',
      name: 'Требуется ли предоплата?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Да, мы работаем по 100% предоплате. Сборка заказа начинается только после подтверждённой оплаты.',
      },
    },
  ],
};

export default function PaymentPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-4xl bg-white text-black">
      <Script
        id="payment-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaPayment) }}
      />
      <PaymentPageClient />
    </main>
  );
}