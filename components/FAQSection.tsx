'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const faqList = [
  {
    question: 'Какую клубнику вы используете в букетах и наборах?',
    answer: (
      <span>
        Мы используем свежую местную и импортную ягоду в зависимости от сезона — вкус остаётся на высоте в любое время года.
        Каждая ягода проходит тщательный ручной отбор — в наши букеты попадает только идеальная клубника, соответствующая стандартам качества.
      </span>
    ),
  },
  {
    question: 'Какой шоколад вы используете?',
    answer: (
      <span>
        В каждом десерте — только премиальный бельгийский шоколад Callebaut.<br />
        Используем разные виды: молочный, белый (без привкуса какао), тёмный (с ярким вкусом какао).<br />
        Только натуральный шоколад, никаких заменителей и глазури.
      </span>
    ),
  },
  {
    question: 'Как работает программа лояльности?',
    answer: (
      <span>
        За каждый заказ вы получаете бонусные рубли — от 2,5% до 15% от суммы заказа.<br />
        1 балл = 1 рубль, их можно использовать при следующих покупках.<br />
        Дарим 1000 баллов за первый заказ на сайте.
      </span>
    ),
  },
  {
    question: 'Можно ли оформить заказ в день покупки?',
    answer: (
      <span>
        Да, мы доставим ваш заказ от 60 минут — всё, чтобы порадовать вас и ваших близких без ожидания.
      </span>
    ),
  },
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section
      id="faq"
      itemScope
      itemType="https://schema.org/FAQPage"
      className="mx-auto my-12 max-w-4xl px-4"
      aria-label="Вопросы и ответы"
    >
      <h2 className="mb-6 text-2xl font-bold text-center tracking-wide">ВОПРОСЫ-ОТВЕТЫ</h2>
      <ul className="divide-y divide-gray-200">
        {faqList.map((faq, idx) => {
          const opened = openIdx === idx;
          return (
            <li
              key={idx}
              itemProp="mainEntity"
              itemScope
              itemType="https://schema.org/Question"
              className="py-4"
            >
              <button
                className="w-full text-left flex justify-between items-center cursor-pointer text-lg font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl transition"
                aria-expanded={opened}
                onClick={() => setOpenIdx(opened ? null : idx)}
                itemProp="name"
                tabIndex={0}
                type="button"
              >
                <span>{faq.question}</span>
                <span
                  className={
                    'ml-3 transition-transform duration-300 text-2xl text-gray-400 ' +
                    (opened ? 'rotate-45' : '')
                  }
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {opened && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div
                      className="mt-3 text-gray-700 text-[15px] leading-6"
                      itemProp="acceptedAnswer"
                      itemScope
                      itemType="https://schema.org/Answer"
                    >
                      <span itemProp="text">{faq.answer}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
