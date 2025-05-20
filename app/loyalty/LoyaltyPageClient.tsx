'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
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
    window.ym?.(12345678, 'reachGoal', 'view_loyalty', { type: 'page_view' });

    const fetchUserData = async () => {
      // TODO: Заменить на российский сервис после миграции
      // Пример: const { data: user } = await russianService.auth.getUser();
      toast.error('Данные пользователя временно недоступны');
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

  return (
    <section className="max-w-6xl mx-auto px-4 py-16 bg-gray-50" aria-label="Программа лояльности">
      <Toaster position="top-right" />
      
      {/* Баланс */}
      {bonusBalance != null && (
        <motion.div
          className="text-right text-sm text-gray-600 mb-6"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Ваш бонусный баланс:{' '}
          <span className="font-semibold">{bonusBalance} ₽</span>
        </motion.div>
      )}

      {/* История бонусов */}
      {bonusHistory.length > 0 && (
        <motion.section
          className="mb-12 bg-white rounded-2xl shadow-lg p-6"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            История начислений
          </h2>
          <div className="overflow-x-auto rounded-xl">
            <table
              className="w-full text-sm text-gray-700"
              role="grid"
              aria-label="История бонусных начислений"
            >
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3 font-semibold" scope="col">Дата</th>
                  <th className="p-3 font-semibold" scope="col">Причина</th>
                  <th className="p-3 font-semibold" scope="col">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {bonusHistory.map((entry, idx) => (
                  <tr
                    key={idx}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">
                      {entry.created_at ? (
                        format(new Date(entry.created_at), 'dd.MM.yyyy', {
                          locale: ru,
                        })
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3">{entry.reason ?? '—'}</td>
                    <td
                      className={`p-3 font-medium ${
                        entry.amount && entry.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {entry.amount != null
                        ? (entry.amount > 0 ? `+${entry.amount}` : entry.amount) + ' ₽'
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}

      {/* Баннер */}
      <motion.div
        className="relative rounded-2xl overflow-hidden mb-12 h-72 bg-black text-white flex items-center justify-center text-center"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <Image
          src="/banner-loyalty.jpg"
          alt="Баннер программы лояльности"
          fill
          className="object-cover opacity-50"
          priority
          quality={75}
        />
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold uppercase">
            Вернём до 15% бонусами!
          </h1>
          <p className="text-base md:text-lg">
            Получайте кешбэк за каждый заказ и оплачивайте до 15% покупок
          </p>
        </div>
      </motion.div>

      {/* Как работает кешбэк */}
      <motion.section
        className="mb-16 text-center"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-8 text-gray-800 uppercase">
          Как работает кешбэк
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Шаг кешбэка 1',
              text: 'Совершите покупку на сайте на любую сумму',
              img: '/images/loyalty-step-1.jpg',
            },
            {
              title: 'Шаг кешбэка 2',
              text: 'С каждой покупки мы начислим кешбэк от 2.5% до 15%',
              img: '/images/loyalty-step-2.jpg',
            },
            {
              title: 'Шаг кешбэка 3',
              text: 'Полученными бонусами можно оплатить до 15% от суммы заказа',
              img: '/images/loyalty-step-3.jpg',
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className="relative bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="absolute inset-0">
                <Image
                  src={step.img}
                  alt={`Шаг кешбэка ${idx + 1}`}
                  fill
                  className="object-cover opacity-10 rounded-2xl"
                  loading="lazy"
                  quality={50}
                />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-semibold mb-2 text-gray-800 flex items-center gap-2">
                  <Image src="/icons/star.svg" alt="Иконка звезды" width={20} height={20} className="text-green-500" aria-hidden="true" />
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Уровни кешбэка */}
      <motion.section
        className="mb-16"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 uppercase">
          Уровни кешбэка
        </h2>
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table
            className="w-full text-sm text-gray-700"
            role="grid"
            aria-label="Уровни кешбэка программы лояльности"
          >
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left font-medium text-gray-600" scope="col">
                  Название уровня
                </th>
                <th className="p-3 text-left font-medium text-gray-600" scope="col">
                  Процент
                </th>
                <th className="p-3 text-left font-medium text-gray-600" scope="col">
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
                  <td className="p-3">{lvl.name}</td>
                  <td className="p-3">{lvl.percent}</td>
                  <td className="p-3">{lvl.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        className="mb-16"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 uppercase">
          Популярные вопросы
        </h2>
        <div className="space-y-3 max-w-3xl mx-auto">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border-b border-gray-200 py-3 cursor-pointer"
              onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
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
                <h3 className="font-medium text-lg text-gray-800">
                  {faq.question}
                </h3>
                <span className="text-xl text-gray-500">
                  {faqOpen === idx ? '−' : '+'}
                </span>
              </div>
              <div
                id={`faq-answer-${idx}`}
                className={`overflow-hidden transition-all duration-300 ${
                  faqOpen === idx ? 'max-h-40 mt-2' : 'max-h-0'
                }`}
              >
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </section>
  );
}