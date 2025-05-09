import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';

export const metadata: Metadata = {
  title: 'Публичная оферта | KeyToHeart',
  description: 'Публичная оферта на получение рекламной рассылки от KeyToHeart. Условия обработки персональных данных и отказа от рассылки в соответствии с 152-ФЗ.',
  keywords: ['оферта', 'KeyToHeart', 'рассылка', 'персональные данные', 'Краснодар', '152-ФЗ', 'реклама'],
  openGraph: {
    title: 'Публичная оферта | KeyToHeart',
    description: 'Публичная оферта на получение рекламной рассылки от KeyToHeart.',
    url: 'https://keytoheart.ru/offer',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-offer.jpg',
        width: 1200,
        height: 630,
        alt: 'Публичная оферта KeyToHeart',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Публичная оферта | KeyToHeart',
    description: 'Публичная оферта на получение рекламной рассылки от KeyToHeart.',
    images: ['https://keytoheart.ru/og-image-offer.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/offer' },
};

export default function OfferPage() {
  return (
    <main
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white text-black min-h-screen"
      aria-label="Публичная оферта"
    >
      {/* Schema.org для SEO */}
      <JsonLd
        item={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Публичная оферта | KeyToHeart',
          url: 'https://keytoheart.ru/offer',
          description: 'Публичная оферта на получение рекламной рассылки от KeyToHeart в соответствии с 152-ФЗ.',
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

      {/* Основной контент с анимацией */}
      <ClientAnimatedSection>
        <section className="max-w-4xl mx-auto space-y-8 text-gray-800">
          {/* Заголовок с адаптивной типографикой */}
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center"
            role="heading"
            aria-level={1}
          >
            Публичная оферта на получение рекламной рассылки
          </h1>

          <p className="text-base sm:text-lg leading-relaxed">
            Настоящая Публичная оферта (далее – Оферта) регламентирует порядок получения
            Пользователем рекламных сообщений от ИП Рашевская Регина Сергеевна (ИНН 234810526700,
            ОГРНИП 324237500032680), далее – «Администрация».
          </p>

          <div className="space-y-6">
            <h2
              className="text-xl sm:text-2xl font-semibold"
              role="heading"
              aria-level={2}
            >
              1. Общие положения
            </h2>
            <ol
              className="list-decimal pl-5 space-y-2 text-base sm:text-lg leading-relaxed"
              role="list"
              aria-label="Общие положения"
            >
              <li>
                Оферта распространяется на все без исключения отношения между Администрацией и
                Пользователем, касающиеся получения рекламной рассылки.
              </li>
              <li>
                Акцепт Оферты осуществляется путём явного согласия Пользователя на получение
                рассылки (например, через отметку соответствующего пункта при оформлении заказа,
                оплате заказа или отправке сообщения Администрации через сайт или мессенджеры).
              </li>
              <li>
                Срок использования персональных данных – до момента отказа Пользователя от
                рассылки, если иное не предусмотрено законодательством РФ. После отказа данные,
                связанные с рассылкой, удаляются в течение 30 дней, за исключением случаев, когда
                их хранение требуется для выполнения других обязательств (например, бухгалтерских).
              </li>
            </ol>

            <h2
              className="text-xl sm:text-2xl font-semibold"
              role="heading"
              aria-level={2}
            >
              2. Термины и определения
            </h2>
            <ol
              className="list-decimal pl-5 space-y-2 text-base sm:text-lg leading-relaxed"
              role="list"
              aria-label="Термины и определения"
            >
              <li>
                <strong>Рекламная рассылка</strong> – информация о товарах, акциях и специальных
                предложениях, направляемая Администрацией на контактные данные Пользователя.
              </li>
              <li>
                <strong>Оператор</strong> – лицо, осуществляющее техническую отправку рекламных
                сообщений по поручению Администрации.
              </li>
              <li>
                <strong>Персональные данные</strong> – сведения, предоставленные Пользователем при
                оформлении заказа или подписке (например, имя, номер телефона, email).
              </li>
            </ol>

            <h2
              className="text-xl sm:text-2xl font-semibold"
              role="heading"
              aria-level={2}
            >
              3. Согласие на рассылку
            </h2>
            <ol
              className="list-decimal pl-5 space-y-2 text-base sm:text-lg leading-relaxed"
              role="list"
              aria-label="Согласие на рассылку"
            >
              <li>
                Пользователь даёт согласие на получение рекламных сообщений путём акцепта Оферты.
                Пользователь может отозвать согласие в любой момент, следуя порядку, указанному в
                разделе 4.
              </li>
              <li>
                Рассылка осуществляется по номеру телефона, email или через мессенджеры (WhatsApp,
                Telegram) — по данным, указанным при оформлении заказа. Пользователь подтверждает,
                что указанные контактные данные принадлежат ему и могут быть использованы для целей
                рассылки.
              </li>
            </ol>

            <h2
              className="text-xl sm:text-2xl font-semibold"
              role="heading"
              aria-level={2}
            >
              4. Порядок отказа от рассылки
            </h2>
            <ol
              className="list-decimal pl-5 space-y-2 text-base sm:text-lg leading-relaxed"
              role="list"
              aria-label="Порядок отказа от рассылки"
            >
              <li>
                Пользователь может в любой момент отозвать согласие, отправив письмо на{' '}
                <TrackedLink
                  href="mailto:info@keytoheart.ru"
                  ariaLabel="Отправить письмо на info@keytoheart.ru"
                  category="Contact"
                  action="Click Email Link"
                  label="Offer Page"
                  className="underline hover:text-gray-900 transition-colors"
                >
                  info@keytoheart.ru
                </TrackedLink>{' '}
                или позвонив по телефону{' '}
                <TrackedLink
                  href="tel:+79886033821"
                  ariaLabel="Позвонить по номеру +7 988 603-38-21"
                  category="Contact"
                  action="Click Phone Link"
                  label="Offer Page"
                  className="underline hover:text-gray-900 transition-colors"
                >
                  +7 988 603-38-21
                </TrackedLink>
                . Также пользователь может отписаться, используя ссылку "Отписаться" в каждом
                сообщении рассылки.
              </li>
              <li>
                Запрос об отказе обрабатывается в течение 3 рабочих дней. Отказ не влияет на уже
                отправленные сообщения.
              </li>
            </ol>

            <h2
              className="text-xl sm:text-2xl font-semibold"
              role="heading"
              aria-level={2}
            >
              5. Обработка персональных данных
            </h2>
            <p className="text-base sm:text-lg leading-relaxed">
              Персональные данные обрабатываются в соответствии с{' '}
              <TrackedLink
                href="/policy"
                ariaLabel="Перейти к политике конфиденциальности"
                category="Navigation"
                action="Click Policy Link"
                label="Offer Page"
                className="underline hover:text-gray-900 transition-colors"
              >
                Политикой конфиденциальности
              </TrackedLink>
              , опубликованной на странице /policy. Данные используются для целей рекламной
              рассылки, уведомлений о статусе заказа и (в обезличенном виде) для аналитики и
              улучшения услуг.
            </p>

            <h2
              className="text-xl sm:text-2xl font-semibold"
              role="heading"
              aria-level={2}
            >
              6. Ответственность сторон
            </h2>
            <ul
              className="list-disc pl-5 space-y-2 text-base sm:text-lg leading-relaxed"
              role="list"
              aria-label="Ответственность сторон"
            >
              <li>
                Администрация несёт ответственность за соблюдение условий Оферты и законодательства
                РФ о персональных данных.
              </li>
              <li>
                Администрация не несёт ответственности за сбои в работе рассылки, вызванные
                техническими проблемами или действиями третьих лиц (например, провайдеров email).
              </li>
              <li>
                Пользователь несёт ответственность за достоверность предоставленных контактных
                данных.
              </li>
            </ul>

            <h2
              className="text-xl sm:text-2xl font-semibold"
              role="heading"
              aria-level={2}
            >
              7. Дополнительные условия
            </h2>
            <ol
              className="list-decimal pl-5 space-y-2 text-base sm:text-lg leading-relaxed"
              role="list"
              aria-label="Дополнительные условия"
            >
              <li>
                Изменения в текст Оферты вносятся Администрацией и публикуются на странице /offer.
                О существенных изменениях пользователи уведомляются по email. Изменения не имеют
                обратной силы.
              </li>
              <li>
                С момента публикации новая редакция вступает в силу для всех пользователей.
              </li>
            </ol>

            <p className="text-xs text-gray-500">
              Обновлено: 2 мая 2025 г.
            </p>
          </div>
        </section>
      </ClientAnimatedSection>
    </main>
  );
}