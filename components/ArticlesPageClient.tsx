'use client';

import { motion } from 'framer-motion';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';

export default function ArticlesPageClient() {
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
          Почему клубничные букеты – идеальный подарок для любого случая
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg leading-relaxed text-center text-gray-600"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Клубничные букеты от KeyToHeart – это не просто подарок, а настоящее произведение искусства, которое сочетает вкус, красоту и эмоции. Узнайте, почему они стали хитом в Краснодаре и как выбрать идеальный букет для любого события.
        </motion.p>

        <motion.div
          className="space-y-6"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
            Уникальность клубничных букетов
          </h2>
          <p className="text-base sm:text-lg leading-relaxed">
            Клубничные букеты – это современная альтернатива традиционным цветочным композициям. Вместо цветов в них используются свежие ягоды клубники, покрытые премиальным шоколадом, дополненные декоративными элементами, такими как цветы, зелень или сладости. Каждый букет создаётся вручную мастерами KeyToHeart, что делает его уникальным.
          </p>
          <p className="text-base sm:text-lg leading-relaxed">
            Почему они так популярны? Во-первых, это сочетание вкуса и эстетики: букет радует глаз и становится вкусным десертом. Во-вторых, это универсальный подарок, подходящий для дней рождения, свадеб, юбилеев или просто для того, чтобы сказать «я тебя люблю». В Краснодаре такие букеты стали настоящим трендом благодаря их яркому дизайну и возможности персонализации.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
            Как выбрать букет для особого случая
          </h2>
          <p className="text-base sm:text-lg leading-relaxed">
            Выбор клубничного букета зависит от повода и предпочтений получателя. Вот несколько советов от KeyToHeart:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-base sm:text-lg" role="list">
            <motion.li
              role="listitem"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <strong>День рождения</strong>: Выберите яркий букет с клубникой в молочном или тёмном шоколаде, украшенный цветами или топперами с поздравлениями.
            </motion.li>
            <motion.li
              role="listitem"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <strong>Свадьба или годовщина</strong>: Подойдут элегантные композиции с белым шоколадом и нежными цветами, такими как розы или пионы.
            </motion.li>
            <motion.li
              role="listitem"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <strong>Корпоративный подарок</strong>: Закажите букет с логотипом компании или в фирменных цветах для стильного впечатления.
            </motion.li>
          </ul>
          <p className="text-base sm:text-lg leading-relaxed">
            Не знаете, что выбрать? Наши менеджеры в Краснодаре помогут подобрать букет, который идеально подойдёт для вашего случая. Просто свяжитесь с нами по телефону{' '}
            <TrackedLink
              href="tel:+79886033821"
              ariaLabel="Позвонить по номеру +7 (988) 603-38-21"
              category="Contact"
              action="Click Phone Link"
              label="Articles Page"
              className="underline hover:text-gray-500 transition-colors"
            >
              +7 (988) 603-38-21
            </TrackedLink>{' '}
            или через{' '}
            <TrackedLink
              href="https://wa.me/79886033821"
              ariaLabel="Написать в WhatsApp"
              category="Contact"
              action="Click WhatsApp Link"
              label="Articles Page"
              className="underline hover:text-gray-500 transition-colors"
            >
              WhatsApp
            </TrackedLink>
            .
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold" role="heading" aria-level={2}>
            Преимущества заказа в KeyToHeart
          </h2>
          <p className="text-base sm:text-lg leading-relaxed">
            KeyToHeart – это не просто интернет-магазин, а место, где создаются эмоции. Вот почему жители Краснодара выбирают нас:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-base sm:text-lg" role="list">
            <motion.li
              role="listitem"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <strong>Свежие ингредиенты</strong>: Мы используем только отборную клубнику и качественный шоколад, чтобы каждый букет был идеальным.
            </motion.li>
            <motion.li
              role="listitem"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <strong>Быстрая доставка</strong>: Доставляем по Краснодару в удобное для вас время, сохраняя свежесть букета.
            </motion.li>
            <motion.li
              role="listitem"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <strong>Персонализация</strong>: Добавьте индивидуальный дизайн, надпись или дополнительные элементы, чтобы сделать подарок особенным.
            </motion.li>
            <motion.li
              role="listitem"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <strong>Программа лояльности</strong>: Получайте кешбэк до 15% бонусами за каждый заказ и используйте их для будущих покупок.
            </motion.li>
          </ul>
          <p className="text-base sm:text-lg leading-relaxed">
            Наши букеты – это способ подарить радость, которая запомнится надолго. Закажите клубничный букет в KeyToHeart и удивите близких уже сегодня!
          </p>

          <div className="text-center mt-8">
            <TrackedLink
              href="/catalog"
              ariaLabel="Перейти в каталог клубничных букетов"
              category="Navigation"
              action="Click Catalog Link"
              label="Articles Page"
              className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Посмотреть каталог
            </TrackedLink>
          </div>
        </motion.div>

        <motion.div
          className="space-y-6 mt-12"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-center" role="heading" aria-level={2}>
            Часто задаваемые вопросы
          </h2>
          <div className="space-y-4">
            {[
              {
                question: 'Как долго хранятся клубничные букеты?',
                answer: 'Клубничные букеты от KeyToHeart сохраняют свежесть до 24 часов при правильном хранении в прохладном месте. Мы используем только свежие ягоды и рекомендуем дарить букет в день доставки.',
              },
              {
                question: 'Можно ли заказать доставку клубничного букета в Краснодаре?',
                answer: 'Да, KeyToHeart предлагает быструю доставку клубничных букетов по Краснодару. Вы можете выбрать удобное время доставки при оформлении заказа.',
              },
              {
                question: 'Как выбрать букет для особого случая?',
                answer: 'Мы предлагаем букеты разных размеров и дизайна для дней рождения, свадеб, юбилеев и других событий. Свяжитесь с нашими менеджерами, чтобы подобрать идеальный вариант!',
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
        </motion.div>
      </section>
    </ClientAnimatedSection>
  );
}