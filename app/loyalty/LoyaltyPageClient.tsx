'use client';

import Image from 'next/image';
import WebpImage from '@components/WebpImage';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

interface BonusHistoryEntry {
  amount: number | null;
  reason: string | null;
  created_at: string | null;
}

interface CashbackLevel {
  name: string;
  percent: string;
  threshold: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function LoyaltyPageClient() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [bonusBalance, setBonusBalance] = useState<number | null>(null);
  const [bonusHistory, setBonusHistory] = useState<BonusHistoryEntry[]>([]);

  useEffect(() => {
    // Аналитика: событие просмотра страницы лояльности
    window.gtag?.('event', 'view_loyalty', { event_category: 'loyalty', type: 'page_view' });
    window.ym?.(96644553, 'reachGoal', 'view_loyalty', { type: 'page_view' });

    const fetchUserData = async () => {
      // TODO: Заменить на российский сервис после миграции
      // Пример: const { data: user } = await russianService.auth.getUser();
      setUserPhone('mock-phone'); // Заглушка
      setBonusBalance(500); // Заглушка
      setBonusHistory([
        { amount: 100, reason: 'Покупка', created_at: '2025-05-01T10:00:00Z' },
        { amount: -50, reason: 'Оплата бонусами', created_at: '2025-05-10T12:00:00Z' },
      ]); // Заглушка
    };

    fetchUserData();
  }, []);

  const faqs: FAQ[] = [
    {
      question: 'Что такое кешбэк?',
      answer: 'Кешбэк – это возврат бонусных баллов на личный счёт. 1 балл = 1 ₽.',
    },
    {
      question: 'Как стать участником программы?',
      answer: 'Вы становитесь участником автоматически при первом заказе.',
    },
    {
      question: 'Где использовать баллы?',
      answer: 'В корзине при оформлении следующего заказа.',
    },
    {
      question: 'Как получить баллы на кассе?',
      answer: 'Назовите номер телефона.',
    },
    {
      question: 'Срок действия бонусов?',
      answer: '6 месяцев с момента последней покупки.',
    },
  ];

  const levels: CashbackLevel[] = [
    { name: 'Бронзовый', percent: '2.5%', threshold: 'Регистрация' },
    { name: 'Серебряный', percent: '5%', threshold: 'от 10 000 ₽' },
    { name: 'Золотой', percent: '7.5%', threshold: 'от 20 000 ₽' },
    { name: 'Платиновый', percent: '10%', threshold: 'от 30 000 ₽' },
    { name: 'Премиум', percent: '15%', threshold: 'от 50 000 ₽' },
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 md:py-16" aria-label="Программа лояльности">
      <Toaster position="top-right" />

      {/* Баннер */}
      <motion.div
        className="relative rounded-lg overflow-hidden mb-12 h-64 bg-black text-white flex items-center justify-center text-center"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <WebpImage
          src="/images/banner-loyalty.jpg"
          alt="Баннер программы лояльности KeyToHeart"
          fill
          className="object-cover opacity-50"
          priority
          quality={75}
        />
        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase">
            Вернём до 15% бонусами!
          </h1>
          <p className="text-sm sm:text-base md:text-lg">
            Получайте кешбэк за каждый заказ и оплачивайте до 15% покупок
          </p>
        </div>
      </motion.div>

      {/* Как работает кешбэк */}
      <motion.section
        className="mb-12 md:mb-16 text-center"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-gray-900 uppercase">
          Как работает кешбэк
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: '/icons/cart.svg',
              text: 'Совершите покупку на сайте на любую сумму',
              alt: 'Иконка корзины',
            },
            {
              icon: '/icons/coin-stack.svg',
              text: 'С каждой покупки мы начислим кешбэк от 2.5% до 15% в течение 24 часов',
              alt: 'Иконка монет',
            },
            {
              icon: '/icons/wallet.svg',
              text: 'Полученными бонусами можно оплатить до 15% от суммы заказа',
              alt: 'Иконка кошелька',
            },
          ].map((step, idx) => (
            <motion.div
              key={idx}
              className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={idx}
              whileHover={{ scale: 1.03 }}
            >
              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Image
                  src={step.icon}
                  alt={step.alt}
                  width={48}
                  height={48}
                  className="text-gray-800"
                />
              </motion.div>
              <p className="text-gray-600 text-sm sm:text-base">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Как получить */}
      <motion.section
        className="mb-12 md:mb-16 text-center"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-gray-900 uppercase">
          Как получить
        </h2>
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-600 text-sm sm:text-base">
            Станьте участником программы лояльности автоматически при первом заказе. Совершайте покупки на сайте, и мы начислим кешбэк на ваш счёт в течение 24 часов. Используйте бонусы для оплаты до 15% суммы следующего заказа!
          </p>
        </div>
      </motion.section>

      {/* Уровни кешбэка */}
      <motion.section
        className="mb-12 md:mb-16"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-gray-900 uppercase">
          Уровни кешбэка
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table
            className="w-full text-sm text-gray-700"
            role="grid"
            aria-label="Уровни кешбэка программы лояльности KeyToHeart"
          >
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-medium text-gray-600 uppercase text-xs sm:text-sm" scope="col">
                  Название уровня
                </th>
                <th className="p-4 text-left font-medium text-gray-600 uppercase text-xs sm:text-sm" scope="col">
                  Процент
                </th>
                <th className="p-4 text-left font-medium text-gray-600 uppercase text-xs sm:text-sm" scope="col">
                  Сумма заказов
                </th>
              </tr>
            </thead>
            <tbody>
              {levels.map((lvl, idx) => (
                <tr
                  key={idx}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 text-gray-800 text-sm">{lvl.name}</td>
                  <td className="p-4 text-gray-800 text-sm">{lvl.percent}</td>
                  <td className="p-4 text-gray-800 text-sm">{lvl.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        className="mb-12 md:mb-16"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center text-gray-900 uppercase">
          Популярные вопросы
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border-b border-gray-200 py-4 cursor-pointer"
              onClick={() => {
                setFaqOpen(faqOpen === idx ? null : idx);
                window.gtag?.('event', 'click_faq', { event_category: 'FAQ', event_label: faq.question });
                window.ym?.(96644553, 'reachGoal', 'click_faq', { question: faq.question });
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === 'Enter' || e.key === ' ') &&
                setFaqOpen(faqOpen === idx ? null : idx)
              }
              aria-expanded={faqOpen === idx}
              aria-controls={`faq-answer-${idx}`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-base sm:text-lg text-gray-800">
                  {faq.question}
                </h3>
                <motion.span
                  className="text-xl text-gray-500"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: faqOpen === idx ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  +
                </motion.span>
              </div>
              <motion.div
                id={`faq-answer-${idx}`}
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: faqOpen === idx ? 'auto' : 0,
                  opacity: faqOpen === idx ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-gray-600 mt-2">{faq.answer}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </motion.section>
    </section>
  );
}