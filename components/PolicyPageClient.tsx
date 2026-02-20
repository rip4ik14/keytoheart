// ✅ Путь: components/PolicyPageClient.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import PolicyLink from '@components/PolicyLink';
import ContactLink from '@components/ContactLink';
import { trackEvent } from '@/lib/analytics';

export default function PolicyPageClient() {
  const handleLinkClick = (label: string, type: 'email' | 'phone' | 'policy') => {
    trackEvent({
      category: 'Navigation',
      action: 'policy_page_link_click',
      label,
      type,
    });
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <section className="container mx-auto px-4 py-10 max-w-4xl text-base leading-relaxed text-black space-y-6">
      <motion.h1
        className="text-2xl sm:text-3xl font-sans font-bold text-center"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        Политика конфиденциальности персональных данных
      </motion.h1>

      <motion.p variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        Настоящая Политика определяет порядок обработки и защиты персональных данных пользователей сайта{' '}
        <Link
          href="/"
          className="underline hover:text-gray-500 transition-colors duration-300"
          aria-label="Перейти на главную страницу"
          onClick={() => handleLinkClick('Главная страница', 'policy')}
        >
          keytoheart.ru
        </Link>{' '}
        (интернет-магазин «Ключ к сердцу»). Оператор персональных данных - Индивидуальный предприниматель Рашевская
        Регина Сергеевна (ИНН 234810526700, ОГРНИП 324237500032680, адрес: Краснодарский край, Северский район, пгт Ильский).
      </motion.p>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">1. Термины</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Оператор</strong> - ИП Рашевская Регина Сергеевна, определяющая цели и способы обработки персональных данных.
          </li>
          <li>
            <strong>Персональные данные</strong> - любая информация, относящаяся к определенному или определяемому физическому лицу.
          </li>
          <li>
            <strong>Обработка</strong> - любое действие с персональными данными (сбор, запись, хранение, использование, передача, удаление и т.д.).
          </li>
          <li>
            <strong>Поручение обработки</strong> - обработка персональных данных третьим лицом по поручению Оператора на основании договора.
          </li>
          <li>
            <strong>Cookies</strong> - небольшие файлы/идентификаторы, которые могут использоваться для работы сайта и (при наличии выбора) аналитики.
          </li>
        </ol>
      </motion.section>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">2. Какие данные мы обрабатываем</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Имя, телефон, email (если указан), адрес доставки, комментарии к заказу;</li>
          <li>Данные получателя (если вы оформляете доставку другому лицу);</li>
          <li>Состав заказа, выбранная дата/время доставки, способ оплаты, информация о примененных скидках/промокодах;</li>
          <li>Данные программы лояльности и история заказов (если используете личный кабинет);</li>
          <li>
            Технические данные: IP-адрес, cookies, user-agent, сведения об устройстве и действиях на сайте (в пределах настроек и законных оснований).
          </li>
        </ul>
      </motion.section>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">3. Цели обработки</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Оформление, подтверждение, оплата и доставка заказов;</li>
          <li>Связь по заказу и сервисные уведомления (статус, уточнения, согласование замен);</li>
          <li>Работа личного кабинета, бонусов и истории заказов;</li>
          <li>Выполнение требований законодательства (кассовые чеки, бухгалтерский учет, ответы на обращения);</li>
          <li>Обеспечение безопасности и предотвращение мошенничества;</li>
          <li>Аналитика работы сайта - только при наличии законных оснований и вашего выбора в баннере cookies (если включено);</li>
          <li>Рекламная рассылка - только при наличии отдельного согласия пользователя.</li>
        </ul>
      </motion.section>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">4. Правовые основания</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Исполнение договора и оформление заказа (обработка необходимых данных для покупки и доставки);</li>
          <li>Согласие пользователя - для маркетинговых рассылок и не обязательных технологий (например, аналитика);</li>
          <li>Исполнение обязанностей по закону (например, кассовые чеки и учет).</li>
        </ul>
      </motion.section>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">5. Сроки хранения</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Данные по заказам и расчетам хранятся в течение сроков, необходимых для исполнения договора и выполнения требований законодательства (включая учет и отчетность).
          </li>
          <li>
            Данные личного кабинета и лояльности хранятся до закрытия аккаунта пользователем или до прекращения программы, если иное не требуется законом.
          </li>
          <li>
            Данные для рассылки (если вы дали согласие) хранятся до отзыва согласия или прекращения рассылки.
          </li>
          <li>
            Технические данные и cookies - в пределах сроков работы соответствующих технологий (сессионные - до закрытия браузера, постоянные - до удаления или истечения срока).
          </li>
        </ul>
      </motion.section>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">6. Передача третьим лицам</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Для исполнения заказа данные могут передаваться курьерским службам, платежным провайдерам, сервисам отправки чеков и IT-подрядчикам - строго в объеме, необходимом для оказания услуги.
          </li>
          <li>
            Если вы выбираете связь через мессенджеры (Telegram, WhatsApp и др.), вы переходите в сторонний сервис и инициируете коммуникацию в этом сервисе. Мы не отвечаем за обработку данных такими сервисами по их правилам.
          </li>
          <li>Госорганам - только по законному и официальному запросу.</li>
        </ul>
        <p className="mt-2">
          При поручении обработки третьим лицам мы заключаем договоры, устанавливающие цели обработки, перечень действий и меры защиты.
        </p>
      </motion.section>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">7. Локализация и инфраструктура</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Персональные данные покупателей хранятся и обрабатываются на инфраструктуре, размещенной на территории Российской Федерации.
          </li>
          <li>
            Каталожные данные (товары, категории, изображения) могут размещаться на сторонних сервисах и не содержат персональные данные.
          </li>
          <li>
            Трансграничная передача персональных данных не является базовой частью нашего процесса. Если такая необходимость возникнет, она будет осуществляться при наличии правовых оснований и соблюдении установленных законом процедур.
          </li>
        </ul>
      </motion.section>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">8. Cookies</h2>
        <p>
          Мы используем cookies и похожие технологии для работы сайта, а также (при наличии вашего выбора) для аналитики.
          Управлять настройками можно через баннер cookies (если он реализован) и/или настройки браузера. Подробнее -{' '}
          <PolicyLink page="cookie-policy" onClick={() => handleLinkClick('Политика Cookies', 'policy')} />.
        </p>
      </motion.section>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">9. Безопасность и инциденты</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Ограничение доступа, журналирование, резервное копирование, HTTPS, контроль прав;</li>
          <li>Доступ только уполномоченным лицам и подрядчикам по договору;</li>
          <li>
            При выявлении инцидента, повлекшего неправомерный доступ/передачу персональных данных, мы действуем по установленным процедурам,
            включая уведомление уполномоченного органа в сроки, предусмотренные законодательством, и проведение внутреннего расследования.
          </li>
        </ul>
      </motion.section>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">10. Права пользователя и обращения</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Получать информацию об обработке персональных данных;</li>
          <li>Требовать уточнения, блокирования или удаления данных при наличии оснований;</li>
          <li>Отозвать согласие на маркетинговую рассылку;</li>
          <li>
            Направить запрос можно на{' '}
            <ContactLink
              href="mailto:info@keytoheart.ru"
              label="info@keytoheart.ru"
              type="email"
              onClick={() => handleLinkClick('Запрос субъекта', 'email')}
            />
            . Для идентификации в запросе укажите телефон, используемый при заказах, и суть требования.
          </li>
        </ul>
      </motion.section>

      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-xl font-semibold">11. Контакты</h2>
        <p>
          ИП Рашевская Регина Сергеевна (ИНН 234810526700, ОГРНИП 324237500032680)
          <br />
          <ContactLink
            href="tel:+79886033821"
            label="+7 (988) 603-38-21"
            type="phone"
            onClick={() => handleLinkClick('Контактный телефон', 'phone')}
          />
          <br />
          <ContactLink
            href="mailto:info@keytoheart.ru"
            label="info@keytoheart.ru"
            type="email"
            onClick={() => handleLinkClick('Контактный email', 'email')}
          />
        </p>
      </motion.section>

      <motion.p
        className="text-sm text-gray-500"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        Обновлено: 20.02.2026
      </motion.p>
    </section>
  );
}