import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { FAQPage, WebPage } from 'schema-dts';
import { motion } from 'framer-motion';
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

      <ClientAnimatedSection>
        <section className="max-w-3xl mx-auto space-y-8">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center"
            role="heading"
            aria-level={1}
          >
            Политика использования cookie
          </h1>

          <div className="space-y-6 text-gray-700 text-base sm:text-lg leading-relaxed">
            <p>
              Настоящая Политика использования cookie разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и объясняет, как интернет-магазин KeyToHeart использует cookie и аналогичные технологии для улучшения пользовательского опыта, анализа трафика и персонализации контента. Cookie рассматриваются как персональные данные, и их использование требует явного согласия Пользователя.[](https://krivoshein.site/roskomnadzor-v-2025-godu-tehnicheskie-aspekty-lokalizatsii-personalnyh-dannyh-i-novye-trebovaniya-k-cookie/)
            </p>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
                1. Что такое cookie?
              </h2>
              <p>
                Cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве (компьютере, смартфоне и т.д.) при посещении веб-сайтов. Они помогают сайту запоминать ваши действия и настройки (например, содержимое корзины, предпочтения языка) для более удобного взаимодействия.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
                2. Какие cookie мы используем?
              </h2>
              <ul className="space-y-2 list-disc pl-5" role="list" aria-label="Типы cookie">
                {[
                  {
                    type: 'Необходимые cookie',
                    description: 'Обеспечивают базовую функциональность сайта, такую как навигация, доступ к корзине и оформление заказов. Эти cookie не могут быть отключены, так как без них сайт не работает корректно.',
                  },
                  {
                    type: 'Аналитические cookie',
                    description: 'Собирают информацию о том, как вы используете сайт (например, какие страницы посещаете). Мы используем Google Analytics и Яндекс.Метрику для анализа данных. Эти cookie можно отключить через баннер.',
                  },
                  {
                    type: 'Функциональные cookie',
                    description: 'Запоминают ваши предпочтения (например, выбор региона доставки) для более удобного взаимодействия с сайтом. Эти cookie можно отключить через баннер.',
                  },
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    role="listitem"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="font-semibold mr-2">{item.type}:</span>
                    <span>{item.description}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
                3. Как управлять cookie?
              </h2>
              <p>
                Вы можете управлять cookie через настройки вашего браузера, блокируя или удаляя их. Отключение необходимых cookie может повлиять на функциональность сайта. При первом посещении сайта вы увидите баннер, позволяющий принять или отклонить аналитические и функциональные cookie. Согласие фиксируется отдельно и может быть отозвано.[](https://krivoshein.site/roskomnadzor-v-2025-godu-tehnicheskie-aspekty-lokalizatsii-personalnyh-dannyh-i-novye-trebovaniya-k-cookie/)[](https://www.esphere.ru/blog/izmeneniya-v-obrabotke-i-zashchite-personalnykh-dannykh-v-2025-godu/)
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
                4. Защита данных cookie
              </h2>
              <p>
                Мы обеспечиваем конфиденциальность данных, собранных через cookie, используя шифрование, ограничение доступа и хранение на защищённых серверах в Российской Федерации. Данные обрабатываются только в заявленных целях и не передаются третьим лицам без законных оснований.[](https://grandawards.ru/blog/obrabotka-personalnyh-dannyh/)
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
                5. Конфиденциальность
              </h2>
              <p>
                Подробности обработки персональных данных, включая cookie, описаны в нашей{' '}
                <TrackedLink
                  href="/policy"
                  ariaLabel="Перейти к политике конфиденциальности"
                  category="Navigation"
                  action="Click Policy Link"
                  label="Cookie Policy Page"
                  className="underline hover:text-gray-500 transition-colors"
                >
                  Политике конфиденциальности
                </TrackedLink>
                .
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
                6. Изменения в политике
              </h2>
              <p>
                Мы можем обновлять эту политику в соответствии с изменениями законодательства или наших процессов. Актуальная версия доступна на этой странице. Дата последнего обновления: 20 мая 2025 года.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
                7. Свяжитесь с нами
              </h2>
              <p>
                Если у вас есть вопросы о нашей политике использования cookie, свяжитесь с нами:
                <br />
                ИП Рашевская Регина Сергеевна (ИНН 234810526700, ОГРНИП 324237500032680)
                <br />
                Телефон:{' '}
                <TrackedLink
                  href="tel:+79886033821"
                  ariaLabel="Позвонить по номеру +7 (988) 603-38-21"
                  category="Contact"
                  action="Click Phone Link"
                  label="Cookie Policy Page"
                  className="underline hover:text-gray-500 transition-colors"
                >
                  +7 (988) 603-38-21
                </TrackedLink>
                <br />
                Email:{' '}
                <TrackedLink
                  href="mailto:info@keytoheart.ru"
                  ariaLabel="Отправить письмо на info@keytoheart.ru"
                  category="Contact"
                  action="Click Email Link"
                  label="Cookie Policy Page"
                  className="underline hover:text-gray-500 transition-colors"
                >
                  info@keytoheart.ru
                </TrackedLink>
              </p>
            </div>
          </div>
        </section>
      </ClientAnimatedSection>
    </main>
  );
}