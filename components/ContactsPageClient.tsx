'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
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
            <strong>Часы работы:</strong> Пн-Вс, 08:00–22:00
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

        {/* Кнопка WhatsApp */}
        <motion.a
          href="https://wa.me/79886033821"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full sm:w-auto px-8 py-3 rounded-lg border-2 border-black text-black font-semibold text-base text-center transition hover:bg-black hover:text-white mb-6"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Написать в WhatsApp
        </motion.a>

        {/* Статическая карта Яндекс */}
        <motion.div
          className="overflow-hidden rounded-2xl border"
          style={{ background: '#eee' }}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Image
            src="https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=39.042147,45.059956&z=17&l=map&pt=39.042147,45.059956,pm2rdl"
            alt="Магазин Ключ к Сердцу на карте"
            className="w-full h-[320px] sm:h-[400px] object-cover"
            loading="lazy"
            width={450}
            height={450}
            unoptimized
          />
          <div className="text-xs p-2 text-center text-gray-500 bg-white border-t">
            <a
              href="https://yandex.ru/maps/org/klyuch_k_serdtsu/41599607553/?ll=39.042147%2C45.059956&z=17"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Открыть на Яндекс.Картах
            </a>
          </div>
        </motion.div>
      </section>
    </ClientAnimatedSection>
  );
}
