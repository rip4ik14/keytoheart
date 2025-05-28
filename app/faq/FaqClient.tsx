'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import Image from 'next/image';

const faqData = [
  {
    category: 'Общие',
    icon: <Image src="/icons/help-circle.svg" alt="Help Circle" width={20} height={20} className="text-black" />,
    questions: [
      {
        q: 'Что такое KeyToHeart?',
        a: 'KeyToHeart — это сервис по созданию и доставке стильных букетов и подарочных наборов из клубники в шоколаде и свежих цветов.\nМы работаем в Краснодаре.',
      },
      {
        q: 'Какие поводы подходят для заказа букетов и наборов?',
        a: 'Наши букеты и подарочные боксы отлично подойдут на:\n• 8 марта\n• День рождения\n• День всех влюблённых\n• Выпускной\n• Или просто чтобы порадовать близкого человека',
      },
      {
        q: 'Могу ли я отказаться от заказа?',
        a: 'Отменить заказ или перенести дату можно не позднее 24 часов до предполагаемого времени доставки или самовывоза.\nПри отмене заказа менее чем за 24 часа — его оплата не возвращается.\n\nМы работаем с клубникой в шоколаде, которая имеет ограниченный срок годности. Каждый заказ собирается индивидуально под клиента, поэтому после того, как флорист соберёт ваш подарок, его нельзя будет использовать в других заказах.',
      },
      {
        q: 'Что делать, если мне не понравился букет?',
        a: 'Напишите нам — нам важно ваше мнение.\nМы всегда найдём решение и сделаем всё, чтобы вы остались довольны.',
      },
      {
        q: 'Можно ли заказать индивидуальный букет или набор?',
        a: 'Да! Вы можете изменить состав, цвет упаковки, добавить/убрать ингредиенты (шоколад, ягоды, посыпки) — просто напишите об этом при оформлении заказа или свяжитесь с менеджером.',
      },
    ],
  },
  {
    category: 'Оформление заказа',
    icon: <Image src="/icons/shopping-cart.svg" alt="Shopping Cart" width={20} height={20} className="text-black" />,
    questions: [
      {
        q: 'Как заказать клубнику в шоколаде или букет на сайте?',
        a: 'Вы можете оформить заказ:\n\n• На сайте (доступно списание бонусов, подробнее в разделе «Программа лояльности»)\n• Связаться с нами по телефону\n• Написать в WhatsApp или Telegram\n• Оформить заказ в официальных группах ВКонтакте и Instagram\n\nНаши менеджеры ответят вам в течение 5 минут в рабочее время с **8:00 до 22:00**.\nЗаказы, оформленные после 22:00, будут подтверждены на следующий день утром после 8:00.',
      },
      {
        q: 'За какое время до праздника лучше оформить заказ?',
        a: 'В будние дни мы принимаем заказы день в день.\nПеред 8 марта, 14 февраля, выпускными и другими пиковыми датами рекомендуем бронировать заранее — за 2–3 дня.',
      },
    ],
  },
  {
    category: 'Оплата и доставка',
    icon: <Image src="/icons/credit-card.svg" alt="Credit Card" width={20} height={20} className="text-black" />,
    questions: [
      {
        q: 'Какие способы оплаты?',
        a: 'СБП, карта онлайн (через ссылку), наличные в мастерской, оплата иностранной картой, безнал по реквизитам для юрлиц.',
      },
      {
        q: 'Куда доставляете?',
        a: 'Краснодар и ближайшие районы.\nДоставка обычно занимает от 1 до 2 часов.',
      },
    ],
  },
  {
    category: 'Состав',
    icon: <Image src="/icons/strawberry.svg" alt="Strawberry" width={20} height={20} className="text-black" />,
    questions: [
      {
        q: 'Какую клубнику в шоколаде вы используете для букетов и наборов?',
        a: 'Мы работаем с клубникой сорта «Альбион» (Армения).\nКаждая ягода проходит ручной отбор.\nПокрываем её бельгийским шоколадом Callebaut и Sicao, не используя глазурь и заменители.',
      },
      {
        q: 'Есть ли упаковка с надписями (например, "Люблю", "С Днём рождения")?',
        a: 'Да! Укажите это при заказе.',
      },
      {
        q: 'Какой срок годности у клубники в шоколаде?',
        a: '• Клубника в шоколаде: до 12 часов (в холодильнике +2…+5°C)\n• Без шоколада: до 24 часов\n• Важно не держать букеты под солнцем или в тепле',
      },
      {
        q: 'Сколько клубники в букете?',
        a: 'В композициях мы считаем клубнику по весу, а не количеству, так как ягода может быть разного калибра.\nЕсли ягода крупная, её будет немного меньше, если мелкая — то, соответственно, больше, но по весу они будут одинаковыми, так как перед сборкой ягода обязательно взвешивается.',
      },
      {
        q: 'Защищены ли букеты от внешней среды?',
        a: 'Да, клубничные букеты упаковываются в прозрачную защитную плёнку, чтобы ягоды не контактировали с воздухом.\nПодарочные наборы помещаются в коробки с брендированной упаковкой.',
      },
    ],
  },
  {
    category: 'Программа лояльности',
    icon: <Image src="/icons/gift.svg" alt="Gift" width={20} height={20} className="text-black" />,
    questions: [
      {
        q: 'Как работает кешбэк от KeyToHeart?',
        a: 'За каждый заказ начисляются бонусные баллы (от 5 до 20% от суммы заказа, 1 балл = 1 рубль), которые можно использовать при следующем оформлении.\nСтатус виден в корзине после входа в аккаунт.',
      },
      {
        q: 'Где и как списать бонусы?',
        a: 'Бонусы можно списать прямо в корзине при заказе на сайте.\nТакже баллы начисляются и при покупках в мастерской — просто назовите номер телефона.',
      },
      {
        q: 'Сколько действуют бонусы?',
        a: 'Срок действия — 6 месяцев с момента начисления.',
      },
      {
        q: 'Что делать, если уровень скидки или бонусы отображаются некорректно?',
        a: 'Напишите нам — мы всё проверим и исправим, если произошла ошибка в системе.',
      },
    ],
  },
];

export default function FaqClient() {
  const [activeCategory, setActiveCategory] = useState(faqData[0].category);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleAnswer = (i: number, question: string) => {
    setOpenIndexes((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
    // Отправляем аналитику при открытии/закрытии вопроса
    window.gtag?.('event', 'faq_toggle', {
      event_category: 'faq_page',
      event_label: question,
      value: openIndexes.includes(i) ? 0 : 1, // 1 = открыли, 0 = закрыли
    });
    window.ym?.(96644553, 'reachGoal', 'faq_toggle', {
      question,
      action: openIndexes.includes(i) ? 'close' : 'open',
    });
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
      }))
    ),
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-4xl bg-white text-black">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }}
      />

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-12 text-center tracking-tight">
        Часто задаваемые вопросы
      </h1>

      <div className="flex flex-wrap justify-center gap-3 sm:gap-6 border-b mb-6 sm:mb-8">
        {faqData.map((f) => (
          <button
            key={f.category}
            onClick={() => setActiveCategory(f.category)}
            className={`flex items-center gap-2 pb-2 text-sm sm:text-base font-medium tracking-wide border-b-2 transition-all duration-200 hover:text-black hover:border-black
              ${activeCategory === f.category
                ? 'border-black text-black'
                : 'border-transparent text-gray-500'}`}
          >
            {f.icon}
            <span>{f.category}</span>
          </button>
        ))}
      </div>

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
                <Image src="/icons/chevron-up.svg" alt="Chevron Up" width={20} height={20} className="text-gray-500" />
              ) : (
                <Image src="/icons/chevron-down.svg" alt="Chevron Down" width={20} height={20} className="text-gray-500" />
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
                  {q.a.split('\n').map((line, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {line.startsWith('•') ? (
                        <span className="inline-flex items-start gap-2">
                          <Image src="/icons/arrow-right.svg" alt="Arrow Right" width={16} height={16} className="text-black mt-1" />
                          <span>{line.slice(1).trim()}</span>
                        </span>
                      ) : line.startsWith('**') && line.endsWith('**') ? (
                        <span className="font-semibold">{line.slice(2, -2)}</span>
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