// ✅ Путь: components/CookiePolicyPageClient.tsx
'use client';

import { motion } from 'framer-motion';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';

export default function CookiePolicyPageClient() {
  return (
    <ClientAnimatedSection>
      <section className="max-w-3xl mx-auto space-y-8 px-4 py-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center">
          Политика использования cookies
        </h1>

        <div className="space-y-6 text-gray-700 text-base sm:text-lg leading-relaxed">
          <p>
            Мы используем cookies и похожие технологии, чтобы сайт работал корректно, запоминал ваши настройки
            и помогал оформлять заказы. Часть cookies может использоваться для аналитики и улучшения сервиса
            только при наличии вашего выбора (если на сайте включен баннер управления cookies).
            Некоторые идентификаторы могут относиться к персональным данным, если позволяют прямо или косвенно
            идентифицировать пользователя.
          </p>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">1. Что такое cookies</h2>
            <p>
              Cookies - это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении сайта.
              Они помогают запоминать действия и настройки (например, содержимое корзины и выбранный город).
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">2. Какие cookies мы используем</h2>
            <ul className="space-y-2 list-disc pl-5" aria-label="Типы cookies">
              {[
                {
                  type: 'Необходимые',
                  description:
                    'Нужны для базовой работы сайта (навигация, корзина, оформление заказа). Их отключение может нарушить работу сайта.',
                },
                {
                  type: 'Функциональные',
                  description:
                    'Запоминают настройки и предпочтения (например, выбранный город), если вы их используете.',
                },
                {
                  type: 'Аналитические',
                  description:
                    'Помогают понимать, как используется сайт и где улучшить интерфейс. Включаются при наличии вашего выбора/согласия через баннер, если он реализован.',
                },
              ].map((item, index) => (
                <motion.li
                  key={index}
                  className="flex items-start"
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
            <h2 className="text-2xl font-semibold">3. Как управлять cookies</h2>
            <p>
              Вы можете изменить выбор в баннере cookies (если он реализован на сайте) и/или в настройках браузера,
              блокируя или удаляя cookies. Отключение необходимых cookies может повлиять на оформление заказа.
              По вопросам можно написать на{' '}
              <TrackedLink
                href="mailto:info@keytoheart.ru"
                ariaLabel="Написать на info@keytoheart.ru"
                category="Contact"
                action="Click Email Link"
                label="Cookie Policy"
                className="underline hover:text-gray-500 transition-colors"
              >
                info@keytoheart.ru
              </TrackedLink>
              .
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">4. Конфиденциальность</h2>
            <p>
              Подробности обработки персональных данных описаны в{' '}
              <TrackedLink
                href="/policy"
                ariaLabel="Перейти к политике конфиденциальности"
                category="Navigation"
                action="Click Policy Link"
                label="Cookie Policy"
                className="underline hover:text-gray-500 transition-colors"
              >
                Политике конфиденциальности
              </TrackedLink>
              .
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">5. Контакты</h2>
            <p>
              ИП Рашевская Регина Сергеевна (ИНН 234810526700, ОГРНИП 324237500032680)
              <br />
              Телефон:{' '}
              <TrackedLink
                href="tel:+79886033821"
                ariaLabel="Позвонить"
                category="Contact"
                action="Click Phone Link"
                label="Cookie Policy"
                className="underline hover:text-gray-500 transition-colors"
              >
                +7 (988) 603-38-21
              </TrackedLink>
              <br />
              Email:{' '}
              <TrackedLink
                href="mailto:info@keytoheart.ru"
                ariaLabel="Написать"
                category="Contact"
                action="Click Email Link"
                label="Cookie Policy"
                className="underline hover:text-gray-500 transition-colors"
              >
                info@keytoheart.ru
              </TrackedLink>
            </p>
          </div>

          <p className="text-sm text-gray-500">Обновлено: 20.02.2026</p>
        </div>
      </section>
    </ClientAnimatedSection>
  );
}