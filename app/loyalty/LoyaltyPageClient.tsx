'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabasePublic as supabase } from '@/lib/supabase/public';
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

interface Event {
  type: string;
  date: string | null; // Обновляем тип
  description: string | null; // Добавляем description
}

export default function LoyaltyPageClient() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<Event[]>([{ type: 'День рождения', date: '', description: '' }]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [bonusBalance, setBonusBalance] = useState<number | null>(null);
  const [bonusHistory, setBonusHistory] = useState<BonusHistoryEntry[]>([]);

  useEffect(() => {
    // Аналитика: событие просмотра страницы лояльности
    window.gtag?.('event', 'view_loyalty', { event_category: 'loyalty' });
    window.ym?.(12345678, 'reachGoal', 'view_loyalty');

    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const phone = user.user_metadata?.phone || user.phone;
      if (!phone) {
        toast.error('Телефон пользователя не указан');
        return;
      }
      setUserPhone(phone);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('bonus_balance')
        .eq('phone', phone)
        .single();
      if (profile?.bonus_balance != null) {
        setBonusBalance(profile.bonus_balance);
      }

      const { data: history } = await supabase
        .from('bonus_history')
        .select('amount, reason, created_at')
        .eq('phone', phone)
        .order('created_at', { ascending: false });
      if (history) setBonusHistory(history);
    };

    fetchUserData();
  }, []);

  const handleAddEvent = () => {
    if (formData.length < 10) {
      setFormData([...formData, { type: 'День рождения', date: '', description: '' }]);
    } else {
      toast.error('Максимум 10 событий');
    }
  };

  const handleEventChange = (index: number, field: keyof Event, value: string) => {
    const updatedEvents = [...formData];
    updatedEvents[index] = { ...updatedEvents[index], [field]: value };
    setFormData(updatedEvents);
  };

  const handleSubmitDates = async () => {
    if (!userPhone) {
      toast.error('Телефон пользователя не указан');
      return;
    }
    setLoading(true);

    try {
      // Фильтруем события, где заполнены обязательные поля
      const validEvents = formData.filter((event) => event.type && event.date);

      if (validEvents.length > 0) {
        const { error } = await supabase.from('important_dates').insert(
          validEvents.map((event) => ({
            phone: userPhone,
            type: event.type,
            date: event.date || null,
            description: event.description || null,
          }))
        );
        if (error) throw error;
      }

      setSubmitted(true);
      setLoading(false);

      // Аналитика: событие отправки важных дат
      window.gtag?.('event', 'submit_dates', { event_category: 'loyalty' });
      window.ym?.(12345678, 'reachGoal', 'submit_dates');

      setTimeout(() => {
        setFormOpen(false);
        setFormData([{ type: 'День рождения', date: '', description: '' }]);
        setSubmitted(false);
      }, 1500);
    } catch (error: any) {
      setLoading(false);
      toast.error('Ошибка сохранения дат: ' + error.message);
    }
  };

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
                  <th className="p-3 font-semibold">Дата</th>
                  <th className="p-3 font-semibold">Причина</th>
                  <th className="p-3 font-semibold">Сумма</th>
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
          <h1 className="text-4xl md

:text-5xl font-bold uppercase">
            Вернём до 15% бонусами!
          </h1>
          <p className="text-base md:text-lg flex items-center justify-center gap-2">
            <Image src="/icons/gift.svg" alt="Gift" width={20} height={20} className="text-yellow-400" />
            И дарим 300 бонусов за карту клиента и важные даты
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
                  <Image src="/icons/star.svg" alt="Star" width={20} height={20} className="text-green-500" />
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Дополнительные бонусы */}
      <motion.section
        className="mb-16 text-center"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-8 text-gray-800 uppercase">
          Дополнительные бонусы
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: 'Карта клиента',
              text: 'Установите карту и получите 300 бонусов. Доступно в Apple Wallet и Android.',
              buttonText: 'Установить',
              onClick: () => alert('Установка карты клиента...'),
              img: '/images/loyalty-card.jpg',
            },
            {
              title: 'Важные даты',
              text: 'Укажите день рождения и юбилей — мы напомним и подарим скидку',
              buttonText: 'Заполнить',
              onClick: () => setFormOpen(true),
              img: '/images/loyalty-dates.jpg',
            },
          ].map((bonus, idx) => (
            <div
              key={idx}
              className="relative bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="absolute inset-0">
                <Image
                  src={bonus.img}
                  alt={bonus.title}
                  fill
                  className="object-cover opacity-10 rounded-2xl"
                  loading="lazy"
                  quality={50}
                />
              </div>
              <div className="relative z-10 p-6">
                <h3 className="font-semibold text-xl mb-3 text-gray-800">
                  {bonus.title}
                </h3>
                <p className="text-sm mb-4 text-gray-600">{bonus.text}</p>
                <button
                  onClick={bonus.onClick}
                  className="bg-white text-gray-800 px-5 py-2 rounded-full text-sm font-medium border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  aria-label={bonus.buttonText}
                >
                  {bonus.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Модалка для важных дат */}
        {formOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-labelledby="important-dates-title"
            aria-modal="true"
          >
            <motion.div
              className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3
                id="important-dates-title"
                className="text-xl font-bold mb-6 text-gray-800"
              >
                Укажите важные даты
              </h3>
              {formData.map((event, index) => (
                <div key={index} className="space-y-4 mb-4">
                  <div>
                    <label
                      htmlFor={`type-${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Тип события:
                    </label>
                    <select
                      id={`type-${index}`}
                      value={event.type}
                      onChange={(e) => handleEventChange(index, 'type', e.target.value)}
                      className="w-full mb-4 border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      disabled={loading}
                    >
                      <option value="День рождения">День рождения</option>
                      <option value="Годовщина">Годовщина</option>
                      <option value="Особенный день">Особенный день</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor={`date-${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Дата:
                    </label>
                    <input
                      id={`date-${index}`}
                      type="date"
                      value={event.date || ''}
                      onChange={(e) => handleEventChange(index, 'date', e.target.value)}
                      className="w-full mb-4 border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      aria-required="true"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`description-${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Описание (опционально):
                    </label>
                    <input
                      id={`description-${index}`}
                      type="text"
                      value={event.description || ''}
                      onChange={(e) => handleEventChange(index, 'description', e.target.value)}
                      className="w-full mb-4 border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Например, день рождения жены"
                      disabled={loading}
                    />
                  </div>
                </div>
              ))}
              {formData.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="text-sm text-blue-600 hover:underline mb-4"
                  disabled={loading}
                >
                  + Добавить событие
                </button>
              )}
              {submitted ? (
                <p className="text-green-600 text-sm mb-4">
                  Спасибо! Мы сохранили даты.
                </p>
              ) : (
                <button
                  onClick={handleSubmitDates}
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                  aria-label="Сохранить важные даты"
                >
                  {loading ? 'Сохраняем...' : 'Сохранить'}
                </button>
              )}
              <button
                onClick={() => setFormOpen(false)}
                className="mt-4 text-sm underline text-gray-600 hover:text-gray-800 focus:outline-none focus:underline"
                aria-label="Закрыть модальное окно"
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
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
            aria-label="Уровни кешбэка"
          >
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left font-medium text-gray-600">
                  Название уровня
                </th>
                <th className="p-3 text-left font-medium text-gray-600">
                  Процент
                </th>
                <th className="p-3 text-left font-medium text-gray-600">
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