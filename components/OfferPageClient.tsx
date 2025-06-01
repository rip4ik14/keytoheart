// ✅ Путь: components/OfferPageClient.tsx
'use client';

import { motion } from 'framer-motion';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';

export default function OfferPageClient() {
  return (
    <ClientAnimatedSection>
      <section className="max-w-4xl mx-auto space-y-8 text-gray-800">
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center"
          role="heading"
          aria-level={1}
        >
          ПУБЛИЧНАЯ ОФЕРТА НА ПОЛУЧЕНИЕ РЕКЛАМНОЙ РАССЫЛКИ
        </h1>

        <motion.p
          className="text-base sm:text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Настоящая Публичная оферта (далее – Оферта) разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и регламентирует порядок получения Пользователем рекламных сообщений от ИП Рашевская Регина Сергеевна (ИНН 234810526700, ОГРНИП 324237500032680), далее – «Администрация». Все данные хранятся на защищённых серверах в Российской Федерации.
        </motion.p>

        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold" role="heading" aria-level={2}>
            1. Общие положения
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-base sm:text-lg leading-relaxed" role="list" aria-label="Общие положения">
            <li role="listitem">
              Оферта распространяется на все отношения между Администрацией и Пользователем, касающиеся получения рекламной рассылки, включая использование cookies для персонализации.
            </li>
            <li role="listitem">
              Акцепт Оферты осуществляется путём явного, свободного, конкретного, информированного и однозначного согласия Пользователя на получение рассылки (например, через отметку в форме на сайте, при оформлении заказа или в мессенджерах). Согласие оформляется отдельно от иных согласий и не отмечается по умолчанию.
            </li>
            <li role="listitem">
              Персональные данные обрабатываются до момента отказа Пользователя от рассылки или отзыва согласия. После отказа данные удаляются в течение 30 дней, за исключением случаев, когда их хранение требуется для выполнения иных обязательств (например, бухгалтерских или налоговых в течение 5 лет согласно ст. 23 НК РФ).
            </li>
            <li role="listitem">
              Администрация уведомляет Роскомнадзор об изменениях в обработке данных при необходимости в соответствии с 152-ФЗ.
            </li>
            <li role="listitem">
              Документ доступен для людей с ограниченными возможностями в соответствии с ФЗ № 419-ФЗ "О цифровых правах". Для слабовидящих пользователей предусмотрена возможность увеличения шрифта и высококонтрастный режим (доступны в настройках браузера).
            </li>
          </ol>

          <h2 className="text-xl sm:text-2xl font-semibold" role="heading" aria-level={2}>
            2. Термины и определения
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-base sm:text-lg leading-relaxed" role="list" aria-label="Термины и определения">
            <li role="listitem">
              <strong>Рекламная рассылка</strong> – информация о товарах, акциях и специальных предложениях, направляемая Администрацией на контактные данные Пользователя, включая персонализированный контент на основе cookies.
            </li>
            <li role="listitem">
              <strong>Оператор</strong> – юридическое или физическое лицо, осуществляющее техническую отправку сообщений по поручению Администрации с соблюдением конфиденциальности.
            </li>
            <li role="listitem">
              <strong>Персональные данные</strong> – сведения, предоставленные Пользователем (например, имя, номер телефона, email, IP-адрес, данные cookies), обрабатываемые в соответствии с 152-ФЗ.
            </li>
          </ol>

          <h2 className="text-xl sm:text-2xl font-semibold" role="heading" aria-level={2}>
            3. Согласие на рассылку
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-base sm:text-lg leading-relaxed" role="list" aria-label="Согласие на рассылку">
            <li role="listitem">
              Пользователь предоставляет согласие на получение рекламных сообщений путём акцепта Оферты. Согласие может быть отозвано в любой момент согласно разделу 4.
            </li>
            <li role="listitem">
              Рассылка осуществляется по номеру телефона, email или через мессенджеры (WhatsApp, Telegram), указанным Пользователем. Пользователь подтверждает, что контактные данные принадлежат ему и могут использоваться для рассылки, предоставляя их добровольно.
            </li>
            <li role="listitem">
              Администрация использует cookies для персонализации рассылки (например, подбора релевантных предложений). Использование cookies осуществляется на основании отдельного согласия, предоставляемого через баннер или настройки браузера. Пользователь может отключить cookies в настройках браузера, что не повлияет на возможность оформления заказа, но может ограничить персонализацию. Подробности в{' '}
              <TrackedLink
                href="/cookie-policy"
                ariaLabel="Перейти к политике использования cookies"
                category="Navigation"
                action="Click Cookie Policy Link"
                label="Offer Page"
                className="underline hover:text-gray-500 transition-colors"
              >
                Политике использования cookies
              </TrackedLink>.
            </li>
          </ol>

          <h2 className="text-xl sm:text-2xl font-semibold" role="heading" aria-level={2}>
            4. Порядок отказа от рассылки
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-base sm:text-lg leading-relaxed" role="list" aria-label="Порядок отказа от рассылки">
            <li role="listitem">
              Пользователь может отозвать согласие через личный кабинет на Сайте (если зарегистрирован), отправив письмо на{' '}
              <TrackedLink
                href="mailto:info@keytoheart.ru"
                ariaLabel="Отправить письмо на info@keytoheart.ru"
                category="Contact"
                action="Click Email Link"
                label="Offer Page"
                className="underline hover:text-gray-500 transition-colors"
              >
                info@keytoheart.ru
              </TrackedLink>{' '}
              или позвонив по телефону{' '}
              <TrackedLink
                href="tel:+79886033821"
                ariaLabel="Позвонить по номеру +7 (988) 603-38-21"
                category="Contact"
                action="Click Phone Link"
                label="Offer Page"
                className="underline hover:text-gray-500 transition-colors"
              >
                +7 (988) 603-38-21
              </TrackedLink>. Также доступна ссылка «Отписаться» в каждом сообщении рассылки.
            </li>
            <li role="listitem">
              Запрос об отказе обрабатывается в течение 3 рабочих дней. Отказ не влияет на ранее отправленные сообщения или обработку данных для иных целей (например, выполнения заказа).
            </li>
            <li role="listitem">
              При отзыве согласия Администрация прекращает обработку данных для рассылки и удаляет их в течение 30 дней, если иное не предусмотрено законодательством. Отзыв согласия не влияет на законность обработки, выполненной до отзыва.
            </li>
          </ol>

          <h2 className="text-xl sm:text-2xl font-semibold" role="heading" aria-level={2}>
            5. Обработка персональных данных
          </h2>
          <motion.div
            className="space-y-2 text-base sm:text-lg leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <p>
              Персональные данные обрабатываются в соответствии с{' '}
              <TrackedLink
                href="/policy"
                ariaLabel="Перейти к политике конфиденциальности"
                category="Navigation"
                action="Click Policy Link"
                label="Offer Page"
                className="underline hover:text-gray-500 transition-colors"
              >
                Политикой конфиденциальности
              </TrackedLink>. Данные используются для:
            </p>
            <ul className="list-disc pl-5 space-y-1" role="list">
              <li role="listitem">Отправки рекламной рассылки;</li>
              <li role="listitem">Уведомлений о статусе заказа;</li>
              <li role="listitem">Обезличенной аналитики и улучшения услуг;</li>
              <li role="listitem">Передачи обезличенных данных по запросу государственных органов в целях статистики в соответствии с ФЗ № 233-ФЗ.</li>
            </ul>
            <p>
              Администрация применяет меры безопасности: шифрование, ограничение доступа, регулярный контроль защищённости данных, хранение на защищённых серверах в Российской Федерации. Трансграничная передача данных не осуществляется.
            </p>
          </motion.div>

          <h2 className="text-xl sm:text-2xl font-semibold" role="heading" aria-level={2}>
            6. Ответственность сторон
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-base sm:text-lg leading-relaxed" role="list" aria-label="Ответственность сторон">
            <li role="listitem">
              Администрация обеспечивает соблюдение 152-ФЗ и условий Оферты, включая защиту данных и конфиденциальность.
            </li>
            <li role="listitem">
              Администрация не несёт ответственности за сбои в работе рассылки, вызванные форс-мажорными обстоятельствами (например, отключением серверов, действиями третьих лиц, сбоями провайдеров) или недостоверностью предоставленных Пользователем данных. В случае сбоя Администрация приложит разумные усилия для восстановления работы рассылки в кратчайшие сроки.
            </li>
            <li role="listitem">
              Пользователь несёт ответственность за достоверность и актуальность предоставленных контактных данных.
            </li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-semibold" role="heading" aria-level={2}>
            7. Дополнительные условия
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-base sm:text-lg leading-relaxed" role="list" aria-label="Дополнительные условия">
            <li role="listitem">
              Администрация вправе вносить изменения в Оферту, публикуя новую версию на странице https://keytoheart.ru/offer. Пользователи уведомляются о существенных изменениях по email за 10 дней до их вступления в силу. Изменения не имеют обратной силы.
            </li>
            <li role="listitem">
              Новая редакция вступает в силу с момента публикации, если иное не указано.
            </li>
            <li role="listitem">
              Споры разрешаются путём переговоров, а при недостижении согласия – в суде в соответствии с законодательством РФ, включая право Пользователя подать иск по месту своего жительства (ст. 17 Закона РФ «О защите прав потребителей» № 2300-1).
            </li>
            <li role="listitem">
              Контакты для обращений:
              <br />
              ИП Рашевская Регина Сергеевна (ИНН 234810526700, ОГРНИП 324237500032680)
              <br />
              Телефон:{' '}
              <TrackedLink
                href="tel:+79886033821"
                ariaLabel="Позвонить по номеру +7 (988) 603-38-21"
                category="Contact"
                action="Click Phone Link"
                label="Offer Page"
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
                label="Offer Page"
                className="underline hover:text-gray-500 transition-colors"
              >
                info@keytoheart.ru
              </TrackedLink>
            </li>
          </ol>

          <motion.p
            className="text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Обновлено: 20 мая 2025 г.
          </motion.p>
        </div>
      </section>
    </ClientAnimatedSection>
  );
}