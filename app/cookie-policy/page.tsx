import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';

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

export default function CookiePolicyPage() {
  return (
    <main
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white text-black min-h-screen"
      aria-label="Политика использования cookie"
    >
      {/* Schema.org для SEO */}
      <JsonLd
        item={{
          '@context': 'https://schema.org',
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
              email: 'support@keytoheart.ru',
              telephone: '+7-988-603-38-21',
              contactType: 'customer service',
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
            Политика использования cookie
          </h1>

          {/* Основной текст политики */}
          <div className="space-y-6 text-gray-700 text-base sm:text-lg leading-relaxed">
            <p>
              Интернет-магазин KeyToHeart использует cookie для улучшения вашего пользовательского опыта, анализа трафика и персонализации контента. Настоящая политика объясняет, какие cookie мы используем и как вы можете управлять ими.
            </p>

            {/* Раздел: Что такое cookie */}
            <div className="space-y-2">
              <h2
                className="text-xl sm:text-2xl font-semibold"
                role="heading"
                aria-level={2}
              >
                Что такое cookie?
              </h2>
              <p>
                Cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве (компьютере, смартфоне и т.д.) при посещении веб-сайтов. Они помогают сайту запоминать ваши действия и настройки (например, содержимое корзины, предпочтения языка) для более удобного взаимодействия.
              </p>
            </div>

            {/* Раздел: Какие cookie мы используем */}
            <div className="space-y-2">
              <h2
                className="text-xl sm:text-2xl font-semibold"
                role="heading"
                aria-level={2}
              >
                Какие cookie мы используем?
              </h2>
              <ul className="space-y-2 list-none" role="list" aria-label="Типы cookie">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">Необходимые cookie:</span>
                  <span>Обеспечивают базовую функциональность сайта, такую как навигация, доступ к корзине и оформление заказов. Без них сайт не может работать корректно.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">Аналитические cookie:</span>
                  <span>Собирают информацию о том, как вы используете сайт (например, какие страницы посещаете). Мы используем Google Analytics и Яндекс.Метрику для анализа данных.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">Функциональные cookie:</span>
                  <span>Запоминают ваши предпочтения (например, выбор региона доставки) для более удобного взаимодействия с сайтом.</span>
                </li>
              </ul>
            </div>

            {/* Раздел: Как управлять cookie */}
            <div className="space-y-2">
              <h2
                className="text-xl sm:text-2xl font-semibold"
                role="heading"
                aria-level={2}
              >
                Как управлять cookie?
              </h2>
              <p>
                Вы можете управлять cookie через настройки вашего браузера. Большинство браузеров позволяют блокировать или удалять cookie. Обратите внимание, что отключение необходимых cookie может повлиять на функциональность сайта.
              </p>
              <p>
                При первом посещении нашего сайта вы увидите баннер с уведомлением о cookie. Вы можете принять или отклонить использование cookie, кроме необходимых.
              </p>
            </div>

            {/* Раздел: Конфиденциальность */}
            <div className="space-y-2">
              <h2
                className="text-xl sm:text-2xl font-semibold"
                role="heading"
                aria-level={2}
              >
                Конфиденциальность
              </h2>
              <p>
                Мы заботимся о безопасности ваших данных. Подробнее о том, как мы обрабатываем персональные данные, вы можете узнать в нашей{' '}
                <TrackedLink
                  href="/policy"
                  ariaLabel="Перейти к политике конфиденциальности"
                  category="Navigation"
                  action="Click Policy Link"
                  label="Cookie Policy Page"
                  className="underline hover:text-gray-900 transition-colors"
                >
                  Политике конфиденциальности
                </TrackedLink>
                .
              </p>
            </div>

            {/* Раздел: Изменения в политике */}
            <div className="space-y-2">
              <h2
                className="text-xl sm:text-2xl font-semibold"
                role="heading"
                aria-level={2}
              >
                Изменения в политике
              </h2>
              <p>
                Мы можем обновлять эту политику в соответствии с изменениями законодательства или наших процессов. Последняя версия всегда доступна на этой странице. Дата последнего обновления: 2 мая 2025 года.
              </p>
            </div>

            {/* Контакты */}
            <div className="space-y-2">
              <h2
                className="text-xl sm:text-2xl font-semibold"
                role="heading"
                aria-level={2}
              >
                Свяжитесь с нами
              </h2>
              <p>
                Если у вас есть вопросы о нашей политике использования cookie, свяжитесь с нами по телефону:{' '}
                <TrackedLink
                  href="tel:+79886033821"
                  ariaLabel="Позвонить по номеру +7 (988) 603-38-21"
                  category="Contact"
                  action="Click Phone Link"
                  label="Cookie Policy Page"
                  className="underline hover:text-gray-900 transition-colors"
                >
                  +7 (988) 603-38-21
                </TrackedLink>{' '}
                или по электронной почте:{' '}
                <TrackedLink
                  href="mailto:support@keytoheart.ru"
                  ariaLabel="Отправить письмо на support@keytoheart.ru"
                  category="Contact"
                  action="Click Email Link"
                  label="Cookie Policy Page"
                  className="underline hover:text-gray-900 transition-colors"
                >
                  support@keytoheart.ru
                </TrackedLink>
                .
              </p>
            </div>
          </div>
        </section>
      </ClientAnimatedSection>
    </main>
  );
}