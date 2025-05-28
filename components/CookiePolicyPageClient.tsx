'use client';

import { motion } from 'framer-motion';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';

export default function CookiePolicyPageClient() {
  return (
    <ClientAnimatedSection>
      <section className="max-w-3xl mx-auto space-y-8">
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center"
          role="heading"
          aria-level={1}
        >
          Политика использования cookies
        </h1>

        <div className="space-y-6 text-gray-700 text-base sm:text-lg leading-relaxed">
          <p>
            Настоящая Политика использования cookies разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и объясняет, как интернет-магазин KeyToHeart использует cookies и аналогичные технологии для улучшения пользовательского опыта, анализа трафика и персонализации контента. Cookies рассматриваются как персональные данные, и их использование требует явного согласия Пользователя.
          </p>
          <p>
            Документ доступен для людей с ограниченными возможностями в соответствии с ФЗ № 419-ФЗ "О цифровых правах". Для слабовидящих пользователей предусмотрена возможность увеличения шрифта и высококонтрастный режим (доступны в настройках браузера).
          </p>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
              1. Что такое cookies?
            </h2>
            <p>
              Cookies — это небольшие текстовые файлы, которые сохраняются на вашем устройстве (компьютере, смартфоне и т.д.) при посещении веб-сайтов. Они помогают сайту запоминать ваши действия и настройки (например, содержимое корзины, предпочтения языка) для более удобного взаимодействия. Аналогичные технологии (например, локальное хранилище браузера) могут использоваться для тех же целей.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
              2. Какие cookies мы используем?
            </h2>
            <ul className="space-y-2 list-disc pl-5" role="list" aria-label="Типы cookies">
              {[
                {
                  type: 'Необходимые cookies',
                  description: 'Обеспечивают базовую функциональность сайта, такую как навигация, доступ к корзине и оформление заказов. Эти cookies не могут быть отключены, так как без них сайт не работает корректно.',
                },
                {
                  type: 'Аналитические cookies',
                  description: 'Собирают информацию о том, как вы используете сайт (например, какие страницы посещаете, сколько времени проводите на сайте). Мы используем Google Analytics и Яндекс.Метрику для анализа данных. Эти cookies можно отключить через баннер.',
                },
                {
                  type: 'Функциональные cookies',
                  description: 'Запоминают ваши предпочтения (например, выбор региона доставки) для более удобного взаимодействия с сайтом. Эти cookies можно отключить через баннер.',
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
              3. Как управлять cookies?
            </h2>
            <p>
              Вы можете управлять cookies через баннер, который отображается при первом посещении сайта, или через настройки вашего браузера, блокируя или удаляя их. Отключение необходимых cookies может повлиять на функциональность сайта (например, невозможность оформить заказ), но отключение аналитических и функциональных cookies не повлияет на базовые функции. Согласие на использование cookies фиксируется отдельно и может быть отозвано в любой момент через настройки браузера или по запросу на{' '}
              <TrackedLink
                href="mailto:info@keytoheart.ru"
                ariaLabel="Отправить письмо на info@keytoheart.ru"
                category="Contact"
                action="Click Email Link"
                label="Cookie Policy Page"
                className="underline hover:text-gray-500 transition-colors"
              >
                info@keytoheart.ru
              </TrackedLink>.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
              4. Защита данных cookies
            </h2>
            <p>
              Мы обеспечиваем конфиденциальность данных, собранных через cookies, используя шифрование, ограничение доступа и хранение на защищённых серверах в Российской Федерации. Данные обрабатываются только в заявленных целях и не передаются третьим лицам без законных оснований. В случае утечки данных Администрация уведомит Пользователя и Роскомнадзор в течение 72 часов.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
              5. Конфиденциальность
            </h2>
            <p>
              Подробности обработки персональных данных, включая cookies, описаны в нашей{' '}
              <TrackedLink
                href="/policy"
                ariaLabel="Перейти к политике конфиденциальности"
                category="Navigation"
                action="Click Policy Link"
                label="Cookie Policy Page"
                className="underline hover:text-gray-500 transition-colors"
              >
                Политике конфиденциальности
              </TrackedLink>.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
              6. Изменения в политике
            </h2>
            <p>
              Мы можем обновлять эту политику в соответствии с изменениями законодательства или наших процессов, уведомляя Пользователя о существенных изменениях за 10 дней до их вступления в силу по email. Актуальная версия доступна на этой странице. Дата последнего обновления: 20 мая 2025 года.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold" role="heading" aria-level={2}>
              7. Свяжитесь с нами
            </h2>
            <p>
              Если у вас есть вопросы о нашей политике использования cookies, свяжитесь с нами:
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
  );
}