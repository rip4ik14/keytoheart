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

        {/* Секция 1: Доставка по Краснодару и пригороду */}
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
                src="/images/delivery-image-1.webp"
                alt="Доставка клубничных букетов по Краснодару"
                fill
                className="object-cover rounded-lg"
                loading="eager"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <h2 role="heading" aria-level={2} className="text-2xl sm:text-3xl font-semibold">
              Доставка по Краснодару и пригороду
            </h2>
            <p className="text-base sm:text-lg leading-relaxed">
              Доставка осуществляется по Краснодару и пригороду (до 30 км) ежедневно с 09:00 до 23:00
            </p>
            <p className="text-base sm:text-lg leading-relaxed">
              Стоимость доставки рассчитывается по тарифам Яндекс.Доставки — окончательную стоимость уточнит менеджер. Также вы можете самостоятельно заказать доставку через Яндекс.Доставку, предупредив менеджера
            </p>
          </div>
        </motion.div>

        {/* Секция 2: Самовывоз — только интерактивная карта */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="space-y-4">
            <h2 role="heading" aria-level={2} className="text-2xl sm:text-3xl font-semibold">
              Самовывоз
            </h2>
            <p className="text-base sm:text-lg leading-relaxed">
              Вы можете забрать заказ самостоятельно в нашей мастерской в Краснодаре по адресу ул. Героев-Разведчиков, 17/1{' '}
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
            <div className="overflow-hidden rounded-lg border aspect-[7/5]">
              <iframe
                src="https://yandex.ru/map-widget/v1/?z=12&ol=biz&oid=81940019159"
                width="100%"
                height="100%"
                frameBorder={0}
                style={{ width: '100%', height: '100%' }}
                allowFullScreen
                title="Карта самовывоза КЛЮЧ К СЕРДЦУ"
              ></iframe>
            </div>
          </div>
        </motion.div>

        {/* Секция 4: FAQ */}
        <motion.div
          className="space-y-4 max-w-3xl mx-auto"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 role="heading" aria-level={2} className="text-2xl sm:text-3xl font-semibold">
            Часто задаваемые вопросы
          </h2>
          <div className="space-y-4">
            {[
              {
                question: 'Как рассчитывается стоимость доставки в Краснодаре?',
                answer: 'Стоимость доставки рассчитывается по тарифам Яндекс.Доставки. Окончательную стоимость уточнит наш менеджер.',
              },
              {
                question: 'Как быстро доставляют букеты КЛЮЧ К СЕРДЦУ?',
                answer: 'Мы доставляем заказы от 30 минут с момента подтверждения.',
              },
              {
                question: 'Можно ли забрать букет самостоятельно?',
                answer: 'Да, вы можете забрать заказ в нашей мастерской в Краснодаре.',
              },
            ].map((faq, index) => (
              <motion.div key={index} className="border-b border-gray-200 py-4" variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <h3 className="text-lg font-semibold text-gray-800">{faq.question}</h3>
                <p className="text-base sm:text-lg text-gray-600 mt-2">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </ClientAnimatedSection>
  );
}
