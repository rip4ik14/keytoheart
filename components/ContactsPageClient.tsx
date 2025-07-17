'use client';

import { motion } from 'framer-motion';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';
import ContactLink from '@components/ContactLink';

export default function ContactsPageClient() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <ClientAnimatedSection>
      <section className="max-w-3xl mx-auto space-y-8">
        <motion.h1
          className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center"
          role="heading"
          aria-level={1}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Контакты
        </motion.h1>
        <motion.p
          className="text-base sm:text-lg leading-relaxed text-center text-gray-600"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Мы всегда рады ответить на ваши вопросы и помочь с выбором идеального букета!
        </motion.p>
        <motion.ul
          className="list-disc pl-5 space-y-2 text-base sm:text-lg"
          role="list"
          aria-label="Контактная информация"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <li role="listitem">
            <strong>Телефон:</strong>{' '}
            <ContactLink
              href="tel:+79886033821"
              label="Позвонить по номеру +7 (988) 603-38-21"
              type="phone"
            />
          </li>
          <li role="listitem">
            <strong>WhatsApp:</strong>{' '}
            <a
              href="https://wa.me/79886033821"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-green-600 transition"
              aria-label="Написать в WhatsApp"
            >
              Написать в WhatsApp
            </a>
          </li>
          <li role="listitem">
            <strong>Email:</strong>{' '}
            <ContactLink
              href="mailto:info@keytoheart.ru"
              label="Отправить письмо на info@keytoheart.ru"
              type="email"
            />
          </li>
          <li role="listitem">
            <strong>Адрес:</strong> г. Краснодар, ул. Героев-Разведчиков, 17/1
          </li>
          <li role="listitem">
            <strong>Часы работы:</strong> Пн-Вс, 09:00–22:00
          </li>
        </motion.ul>
        <motion.p
          className="text-sm text-gray-600"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Ознакомьтесь с нашей{' '}
          <TrackedLink
            href="/policy"
            ariaLabel="Перейти к политике конфиденциальности"
            category="Navigation"
            action="Click Policy Link"
            label="Contacts Page"
            className="underline hover:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
          >
            Политикой конфиденциальности
          </TrackedLink>
          .
        </motion.p>

        {/* Новая интерактивная карта Яндекс */}
        <motion.div
          className="overflow-hidden rounded-2xl border aspect-[7/5]"
          style={{ background: '#eee' }}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <iframe
            src="https://yandex.ru/map-widget/v1/?z=17&ol=biz&oid=81940019159"
            width="100%"
            height="100%"
            frameBorder={0}
            style={{ width: '100%', height: '100%' }}
            allowFullScreen
            title="Магазин Ключ к Сердцу на карте"
          ></iframe>
        </motion.div>
      </section>
    </ClientAnimatedSection>
  );
}
