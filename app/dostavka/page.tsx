import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';

export const metadata: Metadata = {
  title: 'Доставка | KeyToHeart',
  description: 'Условия доставки клубничных букетов и цветов по Краснодару от KeyToHeart. Бесплатная доставка при заказе от 2000 ₽, доставка в день заказа.',
  keywords: ['доставка', 'KeyToHeart', 'Краснодар', 'клубничные букеты', 'цветы', 'бесплатная доставка', 'доставка в день заказа'],
  openGraph: {
    title: 'Доставка | KeyToHeart',
    description: 'Быстрая доставка клубничных букетов и цветов по Краснодару.',
    url: 'https://keytoheart.ru/dostavka',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-dostavka.jpg',
        width: 1200,
        height: 630,
        alt: 'Доставка KeyToHeart',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Доставка | KeyToHeart',
    description: 'Быстрая доставка букетов по Краснодару.',
    images: ['https://keytoheart.ru/og-image-dostavka.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/dostavka' },
};

export default function DostavkaPage() {
  return (
    <main
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white text-black min-h-screen"
      aria-label="Информация о доставке"
    >
      {/* Schema.org для SEO */}
      <JsonLd
        item={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Доставка | KeyToHeart',
          url: 'https://keytoheart.ru/dostavka',
          description: 'Условия доставки клубничных букетов и цветов по Краснодару от KeyToHeart.',
        }}
      />
      <JsonLd
        item={{
          '@context': 'https://schema.org',
          '@type': 'DeliveryService',
          name: 'Доставка KeyToHeart',
          areaServed: {
            '@type': 'City',
            name: 'Краснодар',
            address: {
              '@type': 'PostalAddress',
              addressRegion: 'Краснодарский край',
              addressCountry: 'RU',
            },
          },
          availableDeliveryMethod: 'OnSitePickup, CourierDelivery',
          serviceHours: 'Mo-Su 08:00-22:00',
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
        }}
      />

      {/* Основной контент с анимацией */}
      <ClientAnimatedSection>
        <section className="max-w-3xl mx-auto space-y-8">
          {/* Заголовок с адаптивной типографикой */}
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center"
            role="heading"
            aria-level={1}
          >
            Доставка
          </h1>

          {/* Описание доставки */}
          <div className="space-y-6 text-gray-700 text-base sm:text-lg leading-relaxed">
            <p>
              Мы доставляем клубничные букеты и цветы по <strong>Краснодару</strong> и ближайшим
              районам с заботой о вашем комфорте. Наши курьеры гарантируют свежесть и сохранность
              каждого заказа.
            </p>

            {/* Список условий доставки */}
            <ul
              className="space-y-4 list-none"
              role="list"
              aria-label="Условия доставки"
            >
              <li className="flex items-start">
                <span className="font-semibold mr-2">Время доставки:</span>
                <span>1–2 часа с момента подтверждения заказа.</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">Стоимость:</span>
                <span>Бесплатно по Краснодару при заказе от 2000 ₽, иначе 300 ₽.</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">Зоны доставки:</span>
                <span>Краснодар и пригород (уточняйте у оператора).</span>
              </li>
            </ul>

            {/* Информация о законодательстве */}
            <p className="text-sm text-gray-600">
              Мы заботимся о безопасности ваших данных. Подробнее в нашей{' '}
              <TrackedLink
                href="/policy"
                ariaLabel="Перейти к политике конфиденциальности"
                category="Navigation"
                action="Click Policy Link"
                label="Dostavka Page"
                className="underline hover:text-gray-900 transition-colors"
              >
                Политике конфиденциальности
              </TrackedLink>{' '}
              и{' '}
              <TrackedLink
                href="/cookie-policy"
                ariaLabel="Перейти к политике использования cookie"
                category="Navigation"
                action="Click Cookie Policy Link"
                label="Dostavka Page"
                className="underline hover:text-gray-900 transition-colors"
              >
                Политике cookie
              </TrackedLink>
              .
            </p>
          </div>
        </section>
      </ClientAnimatedSection>
    </main>
  );
}