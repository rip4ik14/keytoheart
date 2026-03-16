// ✅ Путь: app/terms/TermsPageClient.tsx
'use client';

import TrackedLink from '@components/TrackedLink';

export default function TermsPageClient() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Пользовательское соглашение</h1>

      <section className="prose prose-sm sm:prose lg:prose-lg text-gray-800">
        <p>
          Настоящее Пользовательское соглашение (далее - «Соглашение») регулирует отношения между
          Индивидуальным предпринимателем Рашевской Региной Сергеевной (ОГРНИП 324237500032680, ИНН 234810526700,
          адрес: Краснодарский край, Северский район, пгт Ильский), далее - «Администрация сайта»,
          и пользователем (далее - «Пользователь»), возникающие при использовании сайта{' '}
          <TrackedLink
            href="https://keytoheart.ru"
            ariaLabel="Перейти на главную страницу"
            category="Navigation"
            action="Click Home Link"
            label="Terms Page"
            className="underline hover:text-gray-500 transition-colors"
          >
            https://keytoheart.ru
          </TrackedLink>
          .
        </p>

        <p>
          Используя сайт, Пользователь подтверждает, что ознакомился с условиями Соглашения и принимает их.
          Если Пользователь не согласен с условиями, он должен прекратить использование сайта.
        </p>

        <h2>1. Общие положения</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Администрация сайта вправе изменять условия Соглашения, публикуя новую редакцию на странице{' '}
            <TrackedLink
              href="/terms"
              ariaLabel="Перейти к текущей версии"
              category="Navigation"
              action="Click Terms Link"
              label="Terms Page"
              className="underline hover:text-gray-500 transition-colors"
            >
              /terms
            </TrackedLink>
            . Существенные изменения могут дополнительно доводиться до сведения пользователей через уведомления на сайте.
          </li>
          <li>
            Сайт предоставляет возможность ознакомиться с товарами, оформить заказ, выбрать дату/время и способ доставки, применить промокоды и бонусы (если доступно).
          </li>
          <li>
            Пользователь обязуется предоставлять достоверные контактные данные при оформлении заказа. При ошибочных данных исполнение заказа может быть невозможно.
          </li>
          <li>
            Материалы сайта (тексты, фото, графика, логотипы) охраняются законом. Использование материалов без согласия правообладателя запрещено, кроме случаев, допускаемых законом.
          </li>
          <li>
            Администрация сайта не несет ответственности за перебои в работе сайта по причинам, не зависящим от нее (аварии у провайдеров, форс-мажор и т.д.).
          </li>
        </ol>

        <h2>2. Оформление заказов и взаимодействие</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Оформляя заказ, Пользователь соглашается с условиями публичной оферты и подтверждает корректность введенных данных.
          </li>
          <li>
            Для подтверждения заказа Администрация сайта может связаться с Пользователем по телефону, SMS или в мессенджере по контактам, указанным в заказе.
          </li>
          <li>
            Сервисные сообщения по заказу (подтверждение, уточнения, доставка) могут направляться без оформления отдельного рекламного согласия.
          </li>
          <li>
            Рекламные сообщения направляются только при наличии отдельного согласия Пользователя.
          </li>
        </ol>

        <h2>3. Персональные данные</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Обработка персональных данных осуществляется в соответствии с{' '}
            <TrackedLink href="/policy" ariaLabel="Политика" category="Navigation" action="Click Policy" label="Terms" className="underline hover:text-gray-500 transition-colors">
              Политикой конфиденциальности
            </TrackedLink>
            .
          </li>
          <li>
            Политика cookies размещена на странице{' '}
            <TrackedLink href="/cookie-policy" ariaLabel="Cookies" category="Navigation" action="Click Cookie" label="Terms" className="underline hover:text-gray-500 transition-colors">
              /cookie-policy
            </TrackedLink>
            .
          </li>
        </ol>

        <h2>4. Ссылки на документы</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Политика конфиденциальности:{' '}
            <TrackedLink href="/policy" ariaLabel="Политика" category="Navigation" action="Click Policy" label="Terms" className="underline hover:text-gray-500 transition-colors">
              /policy
            </TrackedLink>
          </li>
          <li>
            Политика cookies:{' '}
            <TrackedLink href="/cookie-policy" ariaLabel="Cookies" category="Navigation" action="Click Cookie" label="Terms" className="underline hover:text-gray-500 transition-colors">
              /cookie-policy
            </TrackedLink>
          </li>
          <li>
            Публичная оферта купли-продажи:{' '}
            <TrackedLink href="/public-offer" ariaLabel="Публичная оферта" category="Navigation" action="Click Public Offer" label="Terms" className="underline hover:text-gray-500 transition-colors">
              /public-offer
            </TrackedLink>
          </li>
          <li>
            Согласие на рекламную рассылку:{' '}
            <TrackedLink href="/offer" ariaLabel="Согласие на рассылку" category="Navigation" action="Click Offer" label="Terms" className="underline hover:text-gray-500 transition-colors">
              /offer
            </TrackedLink>
          </li>
        </ul>

        <h2>5. Контакты</h2>
        <p>
          Телефон:{' '}
          <TrackedLink href="tel:+79886033821" ariaLabel="Позвонить" category="Contact" action="Click Phone" label="Terms" className="underline hover:text-gray-500 transition-colors">
            +7 (988) 603-38-21
          </TrackedLink>
          <br />
          Email:{' '}
          <TrackedLink href="mailto:r.rashevskaya@yandex.ru" ariaLabel="Написать" category="Contact" action="Click Email" label="Terms" className="underline hover:text-gray-500 transition-colors">
            r.rashevskaya@yandex.ru
          </TrackedLink>
        </p>

        <p>Дата последней редакции: 20.02.2026</p>
      </section>
    </main>
  );
}