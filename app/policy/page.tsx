import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from 'react-schemaorg';
import type { FAQPage, WebPage } from 'schema-dts';
import { motion } from 'framer-motion';
import PolicyLink from '@components/PolicyLink';
import ContactLink from '@components/ContactLink';
import { trackEvent } from '@/lib/analytics';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности | KeyToHeart',
  description:
    'Политика конфиденциальности KeyToHeart. Узнайте, как мы защищаем ваши персональные данные в соответствии с законодательством РФ (152-ФЗ).',
  keywords: ['политика конфиденциальности', 'KeyToHeart', 'персональные данные', '152-ФЗ', 'Краснодар', 'доставка цветов'],
  openGraph: {
    title: 'Политика конфиденциальности | KeyToHeart',
    description: 'Как KeyToHeart защищает ваши персональные данные в соответствии с законодательством РФ.',
    url: 'https://keytoheart.ru/policy',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'KeyToHeart — политика конфиденциальности',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Политика конфиденциальности | KeyToHeart',
    description: 'Как KeyToHeart защищает ваши персональные данные.',
    images: ['https://keytoheart.ru/og-cover.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/policy' },
};

export const revalidate = 86400;

const faqSchema: FAQPage = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Какие персональные данные собирает KeyToHeart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы собираем фамилию, имя, отчество, контактный телефон, адрес электронной почты, адрес доставки, комментарии к заказу, IP-адрес, данные cookies и другие данные, добровольно предоставленные пользователем.',
      },
    },
    {
      '@type': 'Question',
      name: 'Как KeyToHeart защищает мои данные?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы используем шифрование, ограничение доступа, резервное копирование и безопасные протоколы передачи (HTTPS). Все данные хранятся на серверах в Российской Федерации, соответствующих требованиям законодательства РФ.',
      },
    },
  ],
};

export default function PolicyPage() {
  const handleLinkClick = (label: string, type: 'email' | 'phone' | 'policy') => {
    trackEvent({
      category: 'Navigation',
      action: 'policy_page_link_click',
      label,
      type,
    });
  };

  return (
    <main className="bg-white text-black" aria-label="Политика конфиденциальности">
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Политика конфиденциальности | KeyToHeart',
          url: 'https://keytoheart.ru/policy',
          description: 'Политика конфиденциальности интернет-магазина KeyToHeart в соответствии с 152-ФЗ.',
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

      <section className="container mx-auto px-4 py-10 max-w-4xl text-base leading-relaxed text-black space-y-6">
        <motion.h1
          className="text-2xl sm:text-3xl font-sans font-bold text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Политика конфиденциальности персональных данных
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Настоящая Политика конфиденциальности персональных данных (далее – Политика) разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и действует в отношении всей информации, которую интернет-магазин KeyToHeart, расположенный на доменном имени{' '}
          <Link
            href="/"
            className="underline hover:text-gray-500 transition-colors duration-300"
            aria-label="Перейти на главную страницу KeyToHeart"
            onClick={() => handleLinkClick('Главная страница', 'policy')}
          >
            keytoheart.ru
          </Link>{' '}
          (и его субдоменах), может получить о Пользователе во время использования сайта, его программ и продуктов.
        </motion.p>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">1. Определение терминов</h2>
          <ol className="list-decimal pl-5 space-y-1" role="list">
            {[
              {
                term: 'Администрация сайта',
                description:
                  'Уполномоченные сотрудники, действующие от имени ИП Рашевская Регина Сергеевна (ИНН 234810526700, ОГРНИП 324237500032680), которые организуют и осуществляют обработку персональных данных, определяют цели обработки, состав данных и операции с ними.',
              },
              {
                term: 'Персональные данные',
                description: 'Любая информация, относящаяся к прямо или косвенно определяемому физическому лицу (субъекту персональных данных).',
              },
              {
                term: 'Обработка персональных данных',
                description:
                  'Любое действие или совокупность действий с использованием средств автоматизации или без таковых: сбор, систематизация, хранение, уточнение, использование, распространение, обезличивание, удаление и т.д.',
              },
              {
                term: 'Конфиденциальность персональных данных',
                description: 'Обязательное требование не допускать распространения данных без согласия субъекта или иного законного основания.',
              },
              {
                term: 'Cookies',
                description: 'Небольшой фрагмент данных, отправляемый сервером и хранимый на устройстве Пользователя.',
              },
              {
                term: 'IP-адрес',
                description: 'Уникальный сетевой адрес узла в компьютерной сети.',
              },
              {
                term: 'Сайт KeyToHeart',
                description: 'Совокупность веб-страниц под доменом keytoheart.ru и его субдоменами.',
              },
              {
                term: 'Пользователь',
                description: 'Лицо, использующее сайт KeyToHeart через Интернет.',
              },
            ].map((item, index) => (
              <li key={index} role="listitem">
                <strong>{item.term}</strong> – {item.description}
              </li>
            ))}
          </ol>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">2. Общие положения</h2>
          <ol className="list-decimal pl-5 space-y-1" role="list">
            <li role="listitem">Использование сайта означает согласие Пользователя с условиями этой Политики.</li>
            <li role="listitem">При несогласии с условиями Пользователь должен прекратить использование сайта.</li>
            <li role="listitem">Политика применяется ко всем субдоменам keytoheart.ru. Администрация не контролирует сторонние ресурсы по внешним ссылкам.</li>
            <li role="listitem">Администрация не проверяет достоверность предоставленных Пользователем данных, но принимает меры для их защиты.</li>
            <li role="listitem">Все данные хранятся на серверах в Российской Федерации в соответствии с требованиями законодательства РФ.</li>
          </ol>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">3. Предмет политики конфиденциальности</h2>
          <p>
            Настоящая Политика устанавливает обязательства Администрации по защите конфиденциальности персональных данных, которые Пользователь предоставляет:
          </p>
          <ul className="list-disc pl-5 space-y-1" role="list">
            <li role="listitem">При регистрации на сайте;</li>
            <li role="listitem">При оформлении заказа;</li>
            <li role="listitem">При подписке на информационную e-mail рассылку;</li>
            <li role="listitem">При использовании форм обратной связи;</li>
            <li role="listitem">При участии в программе лояльности.</li>
          </ul>
          <p>
            Согласие на обработку персональных данных предоставляется Пользователем свободно, осознанно и однозначно в отдельной форме, в том числе через баннер cookies.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">4. Состав обрабатываемых персональных данных</h2>
          <ul className="list-disc pl-5 space-y-1" role="list">
            <li role="listitem">Фамилия, имя, отчество Пользователя;</li>
            <li role="listitem">Контактный телефон;</li>
            <li role="listitem">Адрес электронной почты (e-mail);</li>
            <li role="listitem">Адрес доставки товара;</li>
            <li role="listitem">Комментарии к заказу (при необходимости);</li>
            <li role="listitem">IP-адрес, данные cookies, информация о браузере;</li>
            <li role="listitem">Любые другие данные, добровольно предоставленные Пользователем.</li>
          </ul>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">5. Цели обработки персональных данных</h2>
          <ul className="list-disc pl-5 space-y-1" role="list">
            <li role="listitem">Идентификация Пользователя;</li>
            <li role="listitem">Оформление, доставка и оплата заказов;</li>
            <li role="listitem">Установление обратной связи, отправка уведомлений;</li>
            <li role="listitem">Предоставление персонализированного сервиса;</li>
            <li role="listitem">Начисление бонусов в рамках программы лояльности;</li>
            <li role="listitem">Проведение маркетинговых рассылок с согласия Пользователя;</li>
            <li role="listitem">Аналитика и улучшение качества услуг;</li>
            <li role="listitem">Обезличивание данных для передачи по запросу государственных органов в соответствии с ФЗ № 233-ФЗ.</li>
          </ul>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">6. Способы и сроки обработки данных</h2>
          <ol className="list-decimal pl-5 space-y-1" role="list">
            <li role="listitem">
              Обработка осуществляется автоматизированными и/или иными способами без ограничения срока, если иное не предусмотрено законодательством.
            </li>
            <li role="listitem">
              Администрация вправе передавать данные третьим лицам (курьерским службам, платежным провайдерам) исключительно для исполнения заказа с соблюдением конфиденциальности.
            </li>
            <li role="listitem">
              Персональные данные могут передаваться уполномоченным органам власти РФ по основаниям, установленным законодательством.
            </li>
            <li role="listitem">
              Трансграничная передача данных осуществляется только с уведомлением Роскомнадзора и соблюдением требований 152-ФЗ.
            </li>
          </ol>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">7. Защита персональных данных</h2>
          <p>
            Администрация применяет организационные и технические меры для защиты данных, включая:
          </p>
          <ul className="list-disc pl-5 space-y-1" role="list">
            <li role="listitem">Шифрование данных;</li>
            <li role="listitem">Ограничение доступа к данным;</li>
            <li role="listitem">Резервное копирование;</li>
            <li role="listitem">Использование безопасных протоколов передачи (HTTPS);</li>
            <li role="listitem">Хранение данных на серверах в Российской Федерации;</li>
            <li role="listitem">Регулярные проверки безопасности и обучение сотрудников.</li>
          </ul>
          <p>
            Все данные хранятся на защищённых серверах, соответствующих требованиям законодательства РФ.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">8. Права и обязанности сторон</h2>
          <ul className="list-disc pl-5 space-y-1" role="list">
            <li role="listitem">
              Пользователь вправе получать информацию об обработке своих данных, требовать уточнения, блокирования или удаления персональных данных;
            </li>
            <li role="listitem">
              Пользователь может отозвать согласие на обработку данных, направив запрос на{' '}
              <ContactLink
                href="mailto:info@keytoheart.ru"
                label="Отправить письмо на info@keytoheart.ru"
                type="email"
                onClick={() => handleLinkClick('Запрос на отзыв согласия', 'email')}
              />;
            </li>
            <li role="listitem">
              Администрация обязана использовать данные строго в рамках Политики, обеспечивать их конфиденциальность и не передавать третьим лицам без законных оснований.
            </li>
          </ul>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">9. Использование Cookies</h2>
          <p>
            Сайт использует cookies для улучшения пользовательского опыта, аналитики и персонализации. Пользователь может управлять cookies через баннер или настройки браузера. Подробнее в нашей{' '}
            <PolicyLink page="cookie-policy" onClick={() => handleLinkClick('Политика Cookies', 'policy')} />.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">10. Ответственность и разрешение споров</h2>
          <p>
            Администрация несёт ответственность за нарушение условий Политики в соответствии с законодательством РФ. Все споры разрешаются путём переговоров, а при недостижении согласия – в Арбитражном суде Краснодарского края.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.5 }}>
          <h2 className="text-xl font-semibold">11. Дополнительные условия</h2>
          <ol className="list-decimal pl-5 space-y-1" role="list">
            <li role="listitem">
              Администрация вправе вносить изменения в Политику без уведомления Пользователя. Актуальная версия доступна на этой странице.
            </li>
            <li role="listitem">
              По вопросам обработки персональных данных обращаться:
              <br />
              ИП Рашевская Регина Сергеевна (ИНН 234810526700, ОГРНИП 324237500032680)
              <br />
              <ContactLink
                href="tel:+79886033821"
                label="Позвонить по номеру +7 (988) 603-38-21"
                type="phone"
                onClick={() => handleLinkClick('Контактный телефон', 'phone')}
              />
              <br />
              Email:{' '}
              <ContactLink
                href="mailto:info@keytoheart.ru"
                label="Отправить письмо на info@keytoheart.ru"
                type="email"
                onClick={() => handleLinkClick('Контактный email', 'email')}
              />
            </li>
          </ol>
        </motion.section>

        <motion.p
          className="text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          Обновлено: 20 мая 2025 г.
        </motion.p>
      </section>
    </main>
  );
}