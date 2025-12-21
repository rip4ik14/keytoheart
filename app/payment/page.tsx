import type { Metadata } from 'next';
import Script            from 'next/script';
import PaymentPageClient from '@components/PaymentPageClient';

/* ------------------------------------------------------------------ */
/*                               SEO meta                             */
/* ------------------------------------------------------------------ */
export const metadata: Metadata = {
  title: 'Оплата заказа — клубника в шоколаде и букеты',
  description:
    'Все способы оплаты заказов KEY TO HEART: СБП (QR‑код), онлайн‑оплата картой, счёт для юрлиц и оплата иностранной картой. Быстро, удобно и безопасно.',
  keywords: [
    'клубника в шоколаде',
    'клубничные букеты',
    'оплата заказа',
    'доставка Краснодар',
    'KEY TO HEART',
    'СБП',
    'онлайн-оплата',
  ],
  openGraph: {
    title:       'Оплата заказа — клубника в шоколаде и букеты | KEY TO HEART',
    description:
      'Узнайте, как оплатить клубнику в шоколаде, букеты и подарки KEY TO HEART: СБП, онлайн по карте и безнал для юрлиц.',
    url:         'https://keytoheart.ru/payment',
    siteName:    'KEY TO HEART',
    images: [
      {
        url:    'https://keytoheart.ru/og-image-payment.jpg',
        width:  1200,
        height: 630,
        alt:    'Оплата заказов KEY TO HEART',
      },
    ],
    type: 'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Оплата заказа — клубника в шоколаде и букеты | KEY TO HEART',
    description:
      'Все варианты оплаты: СБП, онлайн‑картой, иностранная карта, счёт для юрлиц.',
    images: ['https://keytoheart.ru/og-image-payment.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/payment' },
};

/* --------------------------- FAQ schema --------------------------- */
const schemaPayment = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Какие способы оплаты доступны в KEY TO HEART?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы принимаем оплату через СБП (QR‑код), онлайн по ссылке (CloudPayments), наличными в мастерской, иностранными картами и по реквизитам для юрлиц.',
      },
    },
    {
      '@type': 'Question',
      name: 'Требуется ли предоплата?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Да, работаем по 100 % предоплате. Сборка заказа начинается только после подтверждённой оплаты.',
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/*                               Page                                 */
/* ------------------------------------------------------------------ */
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
