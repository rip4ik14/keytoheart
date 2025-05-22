'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';

export default function DostavkaPageClient() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <ClientAnimatedSection>
      <section className="max-w-6xl mx-auto space-y-12 text-gray-800">
        <motion.h1
          className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center"
          role="heading"
          aria-level={1}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Доставка и оплата
        </motion.h1>

        {/* Секция 1: Доставка по Краснодару и пригороду (текст справа, изображение слева) */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="order-2 md:order-1">
            <div className="relative w-full h-64 md:h-80">
              <Image
                src="/delivery-image-1.jpg"
                alt="Доставка клубничных букетов по Краснодару"
                fill
                className="object-cover rounded-lg"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
              Доставка по Краснодару и пригороду
            </h2>
            <p className="text-base sm:text-lg leading-relaxed">
              Доставка осуществляется по Краснодару и ближайшему пригороду ежедневно с 08:00 до 22:00. При заказе до 18:00 возможна доставка в день заказа.
            </p>
            <p className="text-base sm:text-lg leading-relaxed">
              Стоимость доставки рассчитывается по тарифам Яндекс.Доставки — окончательную стоимость уточнит менеджер. Также вы можете самостоятельно заказать доставку через Яндекс.Доставку.
            </p>
          </div>
        </motion.div>

        {/* Секция 2: Самовывоз (текст слева, изображение справа) */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
              Самовывоз
            </h2>
            <p className="text-base sm:text-lg leading-relaxed">
              Вы можете забрать заказ самостоятельно в нашей мастерской в Краснодаре. Адрес и время работы уточняйте у менеджера по телефону{' '}
              <TrackedLink
                href="tel:+79886033821"
                ariaLabel="Позвонить по номеру +7 (988) 603-38-21"
                category="Contact"
                action="Click Phone Link"
                label="Dostavka Page"
                className="underline hover:text-gray-500 transition-colors"
              >
                +7 (988) 603-38-21
              </TrackedLink>
              .
            </p>
          </div>
          <div>
            <div className="relative w-full h-64 md:h-80">
              <Image
                src="/delivery-image-2.jpg"
                alt="Самовывоз клубничных букетов в Краснодаре"
                fill
                className="object-cover rounded-lg"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </motion.div>

        {/* Секция 3: Оплата */}
        <motion.div
          className="space-y-4 max-w-3xl mx-auto"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
            Оплата
          </h2>
          <p className="text-base sm:text-lg leading-relaxed">
            Мы принимаем оплату банковскими картами на сайте и наличными курьеру при получении заказа. Также возможна оплата по счёту для юридических лиц.
          </p>
        </motion.div>

        {/* Секция 4: Часто задаваемые вопросы */}
        <motion.div
          className="space-y-4 max-w-3xl mx-auto"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
            Часто задаваемые вопросы
          </h2>
          <div className="space-y-4">
            {[
              {
                question: 'Как рассчитывается стоимость доставки в Краснодаре?',
                answer: 'Стоимость доставки рассчитывается по тарифам Яндекс.Доставки. Окончательную стоимость уточнит наш менеджер, либо вы можете самостоятельно заказать доставку через Яндекс.Доставку.',
              },
              {
                question: 'Как быстро доставляют букеты KeyToHeart?',
                answer: 'Мы доставляем заказы в течение 1–2 часов с момента подтверждения. Также возможна доставка в день заказа при оформлении до 18:00.',
              },
              {
                question: 'Можно ли забрать букет самостоятельно?',
                answer: 'Да, вы можете забрать заказ в нашей мастерской в Краснодаре. Уточните адрес и время у менеджера.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="border-b border-gray-200 py-4"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h3 className="text-lg font-semibold text-gray-800">{faq.question}</h3>
                <p className="text-base sm:text-lg text-gray-600 mt-2">{faq.answer}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-sm text-gray-600">
            Мы заботимся о безопасности ваших данных. Подробности в нашей{' '}
            <TrackedLink
              href="/policy"
              ariaLabel="Перейти к политике конфиденциальности"
              category="Navigation"
              action="Click Policy Link"
              label="Dostavka Page"
              className="underline hover:text-gray-500 transition-colors"
            >
              Политике конфиденциальности
            </TrackedLink>{' '}
            и{' '}
            <TrackedLink
              href="/cookie-policy"
              ariaLabel="Перейти к политике использования cookie"
              category="Navigation"
              action="Click Cookie Policy Link"
              label="Dostavka Page"
              className="underline hover:text-gray-500 transition-colors"
            >
              Политике cookie
            </TrackedLink>
            .
          </p>
        </motion.div>
      </section>
    </ClientAnimatedSection>
  );
}