import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ContactPage, FAQPage, WebPage } from 'schema-dts';
import ContactsPageClient from '@components/ContactsPageClient';

export const metadata: Metadata = {
  title: 'Контакты | KeyToHeart',
  description: 'Свяжитесь с KeyToHeart для заказа клубничных букетов и цветов в Краснодаре. Телефон, email, адрес и часы работы.',
  keywords: [
    'контакты',
    'KeyToHeart',
    'доставка букетов Краснодар',
    'клубничные букеты',
    'цветы',
    'заказ букетов',
    'Краснодар',
  ],
  openGraph: {
    title: 'Контакты | KeyToHeart',
    description: 'Свяжитесь с нами для заказа букетов в Краснодаре.',
    url: 'https://keytoheart.ru/contacts',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-contacts.jpg',
        width: 1200,
        height: 630,
        alt: 'Контакты KeyToHeart',
        type: 'image/jpeg',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Контакты | KeyToHeart',
    description: 'Свяжитесь с нами для заказа букетов в Краснодаре.',
    images: ['https://keytoheart.ru/og-image-contacts.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/contacts' },
};

export const revalidate = 86400;

const contactSchema: ContactPage = {
  '@type': 'ContactPage',
  name: 'Контакты KeyToHeart',
  url: 'https://keytoheart.ru/contacts',
  description: 'Свяжитесь с KeyToHeart для заказа букетов.',
  mainEntity: {
    '@type': 'LocalBusiness',
    name: 'KeyToHeart',
    url: 'https://keytoheart.ru',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+7-988-603-38-21',
        contactType: 'customer service',
        areaServed: 'RU',
        availableLanguage: 'Russian',
      },
      {
        '@type': 'ContactPoint',
        email: 'info@keytoheart.ru',
        contactType: 'customer service',
        areaServed: 'RU',
        availableLanguage: 'Russian',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ул. Героев-Разведчиков, 17/1',
      addressLocality: 'Краснодар',
      addressCountry: 'RU',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '22:00',
    },
  },
};

const faqSchema: FAQPage = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Как связаться с KeyToHeart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Вы можете позвонить по телефону +7 (988) 603-38-21, написать на email info@keytoheart.ru или связаться через WhatsApp/Telegram. Мы работаем с 08:00 до 22:00 ежедневно.',
      },
    },
    {
      '@type': 'Question',
      name: 'Где находится мастерская KeyToHeart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Наша мастерская находится по адресу: г. Краснодар, ул. Героев-Разведчиков, 17/1.',
      },
    },
  ],
};

export default function ContactsPage() {
  return (
    <main
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white text-black min-h-screen"
      aria-label="Контакты"
    >
      <JsonLd<ContactPage> item={contactSchema} />
      <JsonLd<FAQPage> item={faqSchema} />
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Контакты | KeyToHeart',
          url: 'https://keytoheart.ru/contacts',
          description: 'Свяжитесь с KeyToHeart для заказа клубничных букетов и цветов в Краснодаре.',
          datePublished: '2025-05-20',
          mainEntity: {
            '@type': 'Organization',
            name: 'KeyToHeart',
            url: 'https://keytoheart.ru',
          },
        }}
      />
      <ContactsPageClient />
    </main>
  );
}