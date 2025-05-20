'use client';

import { motion } from 'framer-motion';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';

export default function DostavkaPageClient() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <ClientAnimatedSection>
      <section className="max-w-3xl mx-auto space-y-8 text-gray-800">
        <motion.h1
          className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center"
          role="heading"
          aria-level={1}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Доставка клубничных букетов в Краснодаре
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg leading-relaxed text-center text-gray-600"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          KeyToHeart доставляет клубничные букеты и цветочные композиции по Краснодару и пригороду с заботой о свежести и вашем комфорте. Узнайте, как мы делаем ваши подарки незабываемыми!
        </motion.p>

        <motion.div
          className="space-y-6"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
            Как мы обеспечиваем свежесть букетов
          </h2>
          <p className="text-base sm:text-lg leading-relaxed">
            В KeyToHeart мы понимаем, что свежесть – ключ к идеальному клубничному букету. Поэтому:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-base sm:text-lg" role="list" aria-label="Меры для сохранения свежести">
            <motion.li role="listitem" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              Используем только свежие ягоды, закупленные в день сборки.
            </motion.li>
            <motion.li role="listitem" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              Собираем букеты непосредственно перед доставкой.
            </motion.li>
            <motion.li role="listitem" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              Доставляем в специальной упаковке, сохраняющей свежесть до 24 часов.
            </motion.li>
          </ul>
          <p className="text-base sm:text-lg leading-relaxed">
            Наши курьеры работают с 08:00 до 22:00, чтобы ваш букет прибыл в идеальном состоянии в кратчайшие сроки.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
            Зоны и сроки доставки
          </h2>
          <p className="text-base sm:text-lg leading-relaxed">
            Мы доставляем клубничные букеты и цветы по <strong>Краснодару</strong> и ближайшим пригородам. Основные условия:
          </p>
          <ul className="list-disc pl-5 space-y-4 text-base sm:text-lg" role="list" aria-label="Условия доставки">
            <motion.li role="listitem" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <strong>Время доставки</strong>: 1–2 часа с момента подтверждения заказа. Доставка в день заказа доступна при оформлении до 18:00.
            </motion.li>
            <motion.li role="listitem" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <strong>Стоимость</strong>: Бесплатно по Краснодару при заказе от 2000 ₽, иначе – 300 ₽.
            </motion.li>
            <motion.li role="listitem" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <strong>Зоны доставки</strong>: Краснодар и пригород (например, пос. Яблоновский, х. Ленина). Для отдалённых районов уточняйте стоимость у менеджера.
            </motion.li>
            <motion.li role="listitem" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <strong>Самовывоз</strong>: Возможен из нашей мастерской в Краснодаре. Адрес и время уточняйте по телефону{' '}
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
            </motion.li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
            Почему выбирают доставку KeyToHeart
          </h2>
          <p className="text-base sm:text-lg leading-relaxed">
            Мы делаем всё, чтобы ваш подарок стал особенным:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-base sm:text-lg" role="list" aria-label="Преимущества доставки">
            <motion.li role="listitem" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <strong>Гибкость</strong>: Выберите удобное время доставки или самовывоз.
            </motion.li>
            <motion.li role="listitem" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <strong>Надёжность</strong>: Наши курьеры доставляют заказы бережно и вовремя.
            </motion.li>
            <motion.li role="listitem" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <strong>Прозрачность</strong>: Никаких скрытых платежей – стоимость доставки ясна с самого начала.
            </motion.li>
          </ul>
          <p className="text-base sm:text-lg leading-relaxed">
            Закажите клубничный букет в KeyToHeart и подарите близким эмоции, которые запомнятся!{' '}
            <TrackedLink
              href="/catalog"
              ariaLabel="Перейти в каталог букетов"
              category="Navigation"
              action="Click Catalog Link"
              label="Dostavka Page"
              className="underline hover:text-gray-500 transition-colors"
            >
              Перейти в каталог
            </TrackedLink>
            .
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
            Часто задаваемые вопросы
          </h2>
          <div className="space-y-4">
            {[
              {
                question: 'Сколько стоит доставка клубничных букетов в Краснодаре?',
                answer: 'Доставка по Краснодару бесплатна при заказе от 2000 ₽. Для заказов менее 2000 ₽ стоимость доставки составляет 300 ₽.',
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