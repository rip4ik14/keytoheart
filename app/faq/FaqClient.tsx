'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import Image from 'next/image';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

const faqData = [
  {
    category: 'Общие',
    icon: (
      <Image
        src="/icons/help-circle.svg"
        alt="Иконка раздела Общие вопросы"
        width={20}
        height={20}
      />
    ),
    questions: [
      {
        q: 'Что такое КЛЮЧ К СЕРДЦУ?',
        a: 'КЛЮЧ К СЕРДЦУ — это сервис по созданию и доставке букетов и подарочных наборов из клубники в шоколаде и свежих цветов. Работаем по Краснодару и пригороду (Пашковский, Яблоновский, Энка и т.д.)',
      },
      {
        q: 'Какие поводы подходят для заказа букетов и наборов?',
        a: [
          '• 8 Марта, 14 Февраля, День матери',
          '• День рождения, юбилеи, годовщины',
          '• Рождение ребёнка, выписка из роддома',
          '• Выпускной, последний звонок',
          '• Новый год, корпоративные подарки',
          '• Просто чтобы порадовать близкого человека',
        ].join('\n'),
      },
      {
        q: 'Могу ли я отказаться от заказа?',
        a: 'Отменить заказ или перенести дату можно не позднее 24 часов до предполагаемого времени доставки или самовывоза. При отмене заказа менее чем за 24 часа — оплата не возвращается. Каждый заказ собирается индивидуально под клиента и имеет ограниченный срок годности.',
      },
      {
        q: 'Что делать, если мне не понравился букет?',
        a: 'Напишите нам — нам важно ваше мнение. Мы найдём решение и сделаем всё, чтобы вы остались довольны.',
      },
      {
        q: 'Можно ли заказать индивидуальный букет или набор?',
        a: 'Да! Можно изменить состав, цвет упаковки, добавить или убрать ингредиенты. Сообщите об этом при оформлении заказа или свяжитесь с менеджером.',
      },
    ],
  },
  {
    category: 'Оформление заказа',
    icon: (
      <Image
        src="/icons/shopping-cart.svg"
        alt="Иконка оформления заказа"
        width={20}
        height={20}
      />
    ),
    questions: [
      {
        q: 'Как заказать клубнику в шоколаде или букет на сайте?',
        a: [
          '• Через корзину на сайте (доступно списание бонусов)',
          '• По телефону',
          '• В WhatsApp или Telegram',
          '• В официальных группах ВКонтакте и Instagram',
          '',
          'Менеджер ответит в рабочее время 09:00–21:00. Заказы после 21:00 подтверждаются на следующий день утром.',
        ].join('\n'),
      },
      {
        q: 'За какое время до праздника лучше оформить заказ?',
        a: 'В будни — день в день. Перед 8 Марта, 14 Февраля, выпускными и другими пиковыми датами бронируйте за 2–3 дня.',
      },
    ],
  },
  {
    category: 'Оплата и доставка',
    icon: (
      <Image
        src="/icons/credit-card.svg"
        alt="Иконка оплаты и доставки"
        width={20}
        height={20}
      />
    ),
    questions: [
      {
        q: 'Какие способы оплаты?',
        a: 'СБП, онлайн-ссылка CloudPayments (карты РФ и иностранных банков), безнал по реквизитам для юрлиц.',
      },
      {
        q: 'Куда доставляете и сколько по времени?',
        a: 'Краснодар и ближайшие районы (Пашковский, Яблоновский, Энка). Среднее время доставки: 60–120 минут.',
      },
    ],
  },
  {
    category: 'Состав',
    icon: (
      <Image
        src="/icons/strawberry.svg"
        alt="Иконка состава букетов"
        width={20}
        height={20}
      />
    ),
    questions: [
      {
        q: 'Какую клубнику в шоколаде вы используете?',
        a: 'Сорт «Альбион» (Армения), вручную отбираем каждую ягоду. Покрываем бельгийским шоколадом Callebaut и Sicao без глазури и заменителей.',
      },
      {
        q: 'Какой срок годности у клубники в шоколаде?',
        a: [
          '• В шоколаде: до 12 ч (температура +2…+5 °C)',
          '• Без шоколада: до 24 ч',
          'Важно хранить в прохладе и не ставить на солнце.',
        ].join('\n'),
      },
      {
        q: 'Сколько клубники в букете?',
        a: 'Мы считаем по весу, а не по количеству, поскольку ягоды могут быть разного калибра. Перед сборкой каждая партия взвешивается.',
      },
      {
        q: 'Защищены ли букеты от внешней среды?',
        a: 'Да, клубничные букеты упаковываются в прозрачную плёнку, а подарочные боксы помещаются в фирменные коробки.',
      },
    ],
  },
  {
    category: 'Программа лояльности',
    icon: (
      <Image src="/icons/gift.svg" alt="Иконка программы лояльности" width={20} height={20} />
    ),
    questions: [
      {
        q: 'Как работает кешбэк от КЛЮЧ К СЕРДЦУ?',
        a: 'За каждый заказ начисляется кешбэк 5–20 % (1 балл = 1 ₽). Баланс видно в корзине после входа.',
      },
      {
        q: 'Сколько действуют бонусы?',
        a: 'Срок действия бонусов — 6 месяцев с момента начисления.',
      },
      {
        q: 'Где списать бонусы?',
        a: 'В корзине на сайте или назвав номер телефона в мастерской.',
      },
    ],
  },
];

export default function FaqClient() {
  const [activeCategory, setActiveCategory] = useState(faqData[0].category);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleAnswer = (i: number, question: string) => {
    setOpenIndexes((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
    window.gtag?.('event', 'faq_toggle', {
      event_category: 'faq_page',
      event_label: question,
      value: openIndexes.includes(i) ? 0 : 1,
    });
    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', 'faq_toggle', {
        question,
        action: openIndexes.includes(i) ? 'close' : 'open',
      });
    }
  };

  const activeFaq = faqData.find((f) => f.category === activeCategory);

  const schemaFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.flatMap((group) =>
      group.questions.map((q) => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.a,
        },
      })),
    ),
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-4xl bg-white text-black">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }}
      />

      {/* SEO-интро */}
      <p className="text-center text-sm sm:text-base text-gray-600 mb-6">
        Мы собрали ответы на самые частые вопросы о доставке клубники в
        шоколаде и свежих цветах по Краснодару и пригородам.
      </p>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-12 text-center tracking-tight">
        Часто задаваемые вопросы
      </h1>

      {/* Категории */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-6 border-b mb-6 sm:mb-8">
        {faqData.map((f) => (
          <button
            key={f.category}
            onClick={() => setActiveCategory(f.category)}
            className={`flex items-center gap-2 pb-2 text-sm sm:text-base font-medium tracking-wide border-b-2 transition-all duration-200
              ${
                activeCategory === f.category
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-black'
              }`}
          >
            {f.icon}
            <span>{f.category}</span>
          </button>
        ))}
      </div>

      {/* Вопросы */}
      <div className="space-y-4">
        {activeFaq?.questions.map((q, i) => (
          <div
            key={i}
            className="border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 bg-white p-4 sm:p-6 cursor-pointer"
            onClick={() => toggleAnswer(i, q.q)}
          >
            <div className="flex justify-between items-center text-lg sm:text-xl font-semibold text-gray-800">
              <span>{q.q}</span>
              {openIndexes.includes(i) ? (
                <Image
                  src="/icons/chevron-up.svg"
                  alt="Свернуть ответ"
                  width={20}
                  height={20}
                />
              ) : (
                <Image
                  src="/icons/chevron-down.svg"
                  alt="Развернуть ответ"
                  width={20}
                  height={20}
                />
              )}
            </div>
            <AnimatePresence>
              {openIndexes.includes(i) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden text-sm sm:text-base text-gray-600 mt-4 pr-2"
                >
                  {q.a.split('\n').map((line, idx) => (
                    <p key={idx} className="mb-4 leading-relaxed">
                      {line.startsWith('•') ? (
                        <span className="inline-flex items-start gap-2">
                          <Image
                            src="/icons/arrow-right.svg"
                            alt=""
                            width={16}
                            height={16}
                            className="mt-1"
                          />
                          <span>{line.slice(1).trim()}</span>
                        </span>
                      ) : (
                        line
                      )}
                    </p>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}