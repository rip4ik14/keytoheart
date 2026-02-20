// ✅ Путь: components/OfferPageClient.tsx
'use client';

import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';

export default function OfferPageClient() {
  return (
    <ClientAnimatedSection>
      <section className="max-w-4xl mx-auto space-y-8 text-gray-800 px-4 py-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center">
          Согласие на получение рекламной рассылки
        </h1>

        <div className="space-y-5 text-base sm:text-lg leading-relaxed">
          <p>
            Настоящий документ описывает условия предоставления согласия на получение рекламных сообщений от
            ИП Рашевская Регина Сергеевна (ИНН 234810526700, ОГРНИП 324237500032680),
            интернет-магазин «Ключ к сердцу» (далее - «Компания»).
          </p>

          <h2 className="text-xl sm:text-2xl font-semibold">1. Что считается рекламной рассылкой</h2>
          <p>
            Рекламная рассылка - это сообщения об акциях, новинках, специальных предложениях и иных маркетинговых материалах,
            направляемые по указанным вами контактам. Сервисные сообщения по заказу (подтверждение, уточнения, доставка)
            не являются рекламной рассылкой.
          </p>

          <h2 className="text-xl sm:text-2xl font-semibold">2. Как дается согласие</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Согласие дается отдельно (например, отдельной галочкой/переключателем) и не может быть проставлено по умолчанию.
            </li>
            <li>
              Согласие дается на получение рекламы по сетям электросвязи только при вашем предварительном согласии, которое Компания обязана уметь подтвердить.
            </li>
            <li>
              Каналы рассылки (если вы указали контакт и выбрали канал): SMS, email, сообщения в мессенджерах. Рекламные звонки осуществляются только при наличии явного отдельного согласия, если вы его предоставляете.
            </li>
            <li>
              Предоставляя согласие, вы подтверждаете, что указанный номер телефона/email принадлежит вам или вы имеете право его использовать.
            </li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-semibold">3. Фиксация согласия</h2>
          <p>
            Для подтверждения факта согласия Компания может фиксировать технические данные: дату и время, источник формы,
            версию документа, идентификатор согласия, а также контакт, на который оформлено согласие.
          </p>

          <h2 className="text-xl sm:text-2xl font-semibold">4. Как отказаться от рассылки</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Можно отказаться в любой момент, написав на{' '}
              <TrackedLink
                href="mailto:r.rashevskaya@yandex.ru"
                ariaLabel="Написать на email"
                category="Contact"
                action="Click Email"
                label="Offer"
                className="underline hover:text-gray-500 transition-colors"
              >
                r.rashevskaya@yandex.ru
              </TrackedLink>{' '}
              или позвонив по телефону{' '}
              <TrackedLink
                href="tel:+79886033821"
                ariaLabel="Позвонить"
                category="Contact"
                action="Click Phone"
                label="Offer"
                className="underline hover:text-gray-500 transition-colors"
              >
                +7 (988) 603-38-21
              </TrackedLink>
              .
            </li>
            <li>Срок обработки отказа - до 3 рабочих дней.</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-semibold">5. Персональные данные</h2>
          <p>
            Обработка персональных данных в рамках рассылки осуществляется на основании согласия пользователя.
            Подробности - в{' '}
            <TrackedLink
              href="/policy"
              ariaLabel="Перейти к политике конфиденциальности"
              category="Navigation"
              action="Click Policy"
              label="Offer"
              className="underline hover:text-gray-500 transition-colors"
            >
              Политике конфиденциальности
            </TrackedLink>
            .
          </p>

          <h2 className="text-xl sm:text-2xl font-semibold">6. Контакты</h2>
          <p>
            ИП Рашевская Регина Сергеевна (ИНН 234810526700, ОГРНИП 324237500032680)
            <br />
            Email:{' '}
            <TrackedLink
              href="mailto:r.rashevskaya@yandex.ru"
              ariaLabel="Написать"
              category="Contact"
              action="Click Email"
              label="Offer"
              className="underline hover:text-gray-500 transition-colors"
            >
              r.rashevskaya@yandex.ru
            </TrackedLink>
            <br />
            Телефон:{' '}
            <TrackedLink
              href="tel:+79886033821"
              ariaLabel="Позвонить"
              category="Contact"
              action="Click Phone"
              label="Offer"
              className="underline hover:text-gray-500 transition-colors"
            >
              +7 (988) 603-38-21
            </TrackedLink>
          </p>

          <p className="text-sm text-gray-500">Обновлено: 20.02.2026</p>
        </div>
      </section>
    </ClientAnimatedSection>
  );
}