import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';
import ContactLink from '@components/ContactLink';

export const metadata: Metadata = {
  title: 'Контакты | KeyToHeart',
  description: 'Свяжитесь с KeyToHeart для заказа клубничных букетов и цветов в Краснодаре. Телефон, email, адрес и часы работы.',
  keywords: ['контакты', 'KeyToHeart', 'доставка', 'клубничные букеты', 'Краснодар', 'цветы', 'заказ'],
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

export default function ContactsPage() {
  return (
    <main className="container mx-auto px-4 py-10 bg-white text-black" aria-label="Контакты">
      <JsonLd
        item={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Контакты KeyToHeart',
          url: 'https://keytoheart.ru/contacts',
          description: 'Свяжитесь с KeyToHeart для заказа букетов.',
          mainEntity: {
            '@type': 'Organization',
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
            openingHours: 'Mo-Su 08:00-22:00',
          },
        }}
      />
      <ClientAnimatedSection>
        <section className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-2xl sm:text-3xl font-sans font-bold mb-4">Контакты</h1>
          <p className="text-gray-600">
            Мы всегда рады ответить на ваши вопросы и помочь с выбором идеального букета!
          </p>
          <ul className="space-y-2">
            <li>
              <strong>Телефон:</strong>{' '}
              <ContactLink
                href="tel:+79886033821"
                label="Позвонить по номеру +7 (988) 603-38-21"
                type="phone"
              />
            </li>
            <li>
              <strong>Email:</strong>{' '}
              <ContactLink
                href="mailto:info@keytoheart.ru"
                label="Отправить письмо на info@keytoheart.ru"
                type="email"
              />
            </li>
            <li>
              <strong>Адрес:</strong> г. Краснодар, ул. Героев-Разведчиков, 17/1
            </li>
            <li>
              <strong>Часы работы:</strong> Пн-Вс, 08:00–22:00
            </li>
          </ul>
          <p className="text-sm">
            Ознакомьтесь с нашей{' '}
            <TrackedLink
              href="/policy"
              ariaLabel="Перейти к политике конфиденциальности"
              category="Navigation"
              action="Click Policy Link"
              label="Contacts Page"
              className="underline hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
            >
              Политикой конфиденциальности
            </TrackedLink>
            .
          </p>
        </section>
      </ClientAnimatedSection>
    </main>
  );
}