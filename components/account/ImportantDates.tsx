'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import TrackedLink from '@components/TrackedLink';

type Event = { id: number; label: string; type: string; date: string };

export default function ImportantDates() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const phone = session?.user.user_metadata.phone ?? '';
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!session) return;
    fetchDates();
  }, [session]);

  async function fetchDates() {
    const { data } = await supabase
      .from('important_dates')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: true });
    setEvents(data || []);
  }

  function addRow() {
    setEvents((prev) => [
      ...prev,
      { id: Date.now(), label: '', type: '', date: '' },
    ]);
    window.gtag?.('event', 'add_important_date', { event_category: 'account' });
    window.ym?.(12345678, 'reachGoal', 'add_important_date');
  }

  async function saveDates() {
    const payload = events.map((e) => ({
      phone,
      label: e.label,
      type: e.type,
      date: e.date,
    }));
    const { error } = await supabase.from('important_dates').upsert(payload);
    if (error) {
      toast.error('Ошибка сохранения дат');
    } else {
      toast.success('Даты сохранены');
      window.gtag?.('event', 'save_important_dates', { event_category: 'account' });
      window.ym?.(12345678, 'reachGoal', 'save_important_dates');
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.section
      className="space-y-6"
      aria-labelledby="important-dates-title"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="space-y-2">
        <h2 id="important-dates-title" className="text-xl font-semibold tracking-tight">
          Важные даты
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Укажите даты, чтобы мы могли напомнить вам о важных событиях и подарить скидки 🎁
        </p>
      </div>
      <motion.button
        onClick={addRow}
        className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 hover:shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Добавить новую дату"
      >
        + Добавить дату
      </motion.button>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((e) => (
          <motion.div
            key={e.id}
            className="space-y-3 border border-gray-200 p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
            role="form"
            aria-label={`Редактировать событие ${e.label || 'Новое событие'}`}
            variants={itemVariants}
          >
            <label htmlFor={`label-${e.id}`} className="block text-sm font-medium text-gray-700">
              Название события
            </label>
            <input
              id={`label-${e.id}`}
              type="text"
              placeholder="Чьё событие"
              value={e.label}
              onChange={(ev) =>
                setEvents((prev) =>
                  prev.map((x) =>
                    x.id === e.id ? { ...x, label: ev.target.value } : x
                  )
                )
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            />
            <label htmlFor={`type-${e.id}`} className="block text-sm font-medium text-gray-700">
              Тип события
            </label>
            <select
              id={`type-${e.id}`}
              value={e.type}
              onChange={(ev) =>
                setEvents((prev) =>
                  prev.map((x) =>
                    x.id === e.id ? { ...x, type: ev.target.value } : x
                  )
                )
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              aria-label="Тип события"
            >
              <option value="">Выберите тип события</option>
              <option value="birthday">День рождения</option>
              <option value="anniversary">Годовщина</option>
              <option value="other">Другое</option>
            </select>
            <label htmlFor={`date-${e.id}`} className="block text-sm font-medium text-gray-700">
              Дата события
            </label>
            <input
              id={`date-${e.id}`}
              type="date"
              value={e.date}
              onChange={(ev) =>
                setEvents((prev) =>
                  prev.map((x) =>
                    x.id === e.id ? { ...x, date: ev.target.value } : x
                  )
                )
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            />
          </motion.div>
        ))}
      </div>
      <div className="space-y-2">
        <motion.button
          onClick={saveDates}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Сохранить даты"
        >
          Сохранить
        </motion.button>
        <p className="text-xs text-gray-500 text-center">
          Данные обрабатываются в соответствии с нашей{' '}
          <TrackedLink
            href="/policy"
            ariaLabel="Перейти к политике конфиденциальности"
            category="Navigation"
            action="Click Policy Link"
            label="Important Dates"
            className="underline hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
          >
            политикой конфиденциальности
          </TrackedLink>
          .
        </p>
      </div>
    </motion.section>
  );
}