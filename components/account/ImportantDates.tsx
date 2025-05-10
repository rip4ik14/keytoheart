'use client';

import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createBrowserClient } from '@supabase/ssr';
import TrackedLink from '@components/TrackedLink';
import type { Database } from '@/lib/supabase/types_new';

// Тип, соответствующий структуре таблицы important_dates в Supabase
type ImportantDate = {
  id: string;
  user_id: string | null; // Заменяем phone на user_id
  anniversary: string | null;
  birthday: string | null;
  created_at: string | null;
};

// Тип для интерфейса (отображение в UI)
type Event = {
  id: string;
  type: 'anniversary' | 'birthday' | 'other';
  date: string;
  label: string;
};

interface EventCardProps {
  event: Event;
  onChange: (updatedEvent: Event) => void;
  onDelete: (id: string) => void;
}

const EventCard = memo(({ event, onChange, onDelete }: EventCardProps) => {
  // Очистка ввода от потенциально опасных символов
  const sanitizeInput = (value: string) => {
    return value.replace(/[<>&'"]/g, '');
  };

  return (
    <motion.div
      className="space-y-3 border border-gray-200 p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-300 min-w-[250px]"
      role="form"
      aria-label={`Редактировать событие ${event.label || 'Новое событие'}`}
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
      }}
    >
      <label htmlFor={`label-${event.id}`} className="block text-sm font-medium text-gray-700">
        Название события
      </label>
      <input
        id={`label-${event.id}`}
        type="text"
        placeholder="Чьё событие"
        value={event.label}
        onChange={(ev) => onChange({ ...event, label: sanitizeInput(ev.target.value) })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        aria-describedby={`label-desc-${event.id}`}
        maxLength={50}
        required
      />
      <span id={`label-desc-${event.id}`} className="sr-only">
        Введите название события, например, "День рождения мамы"
      </span>

      <label htmlFor={`type-${event.id}`} className="block text-sm font-medium text-gray-700">
        Тип события
      </label>
      <select
        id={`type-${event.id}`}
        value={event.type}
        onChange={(ev) => onChange({ ...event, type: ev.target.value as 'anniversary' | 'birthday' | 'other' })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        aria-label="Тип события"
        aria-describedby={`type-desc-${event.id}`}
        required
      >
        <option value="" disabled>
          Выберите тип события
        </option>
        <option value="birthday">День рождения</option>
        <option value="anniversary">Годовщина</option>
        <option value="other">Другое</option>
      </select>
      <span id={`type-desc-${event.id}`} className="sr-only">
        Выберите тип события из списка
      </span>

      <label htmlFor={`date-${event.id}`} className="block text-sm font-medium text-gray-700">
        Дата события
      </label>
      <input
        id={`date-${event.id}`}
        type="date"
        value={event.date}
        onChange={(ev) => onChange({ ...event, date: ev.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        aria-describedby={`date-desc-${event.id}`}
        required
      />
      <span id={`date-desc-${event.id}`} className="sr-only">
        Выберите дату события в формате ГГГГ-ММ-ДД
      </span>

      <motion.button
        onClick={() => onDelete(event.id)}
        className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={`Удалить событие ${event.label || 'Новое событие'}`}
      >
        Удалить
      </motion.button>
    </motion.div>
  );
});

export default function ImportantDates() {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [events, setEvents] = useState<Event[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchDates(session.user.id);
      }
    };

    fetchUserId();
  }, [supabase]);

  async function fetchDates(userId: string) {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('important_dates')
        .select('id, user_id, anniversary, birthday, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Ошибка загрузки дат:', error);
        toast.error('Ошибка загрузки важных дат');
        return;
      }

      // Преобразуем данные из Supabase в формат Event
      const transformedEvents: Event[] = (data || []).flatMap((item: ImportantDate) => {
        const events: Event[] = [];
        if (item.birthday) {
          events.push({
            id: `${item.id}-birthday`,
            type: 'birthday',
            date: item.birthday,
            label: 'День рождения',
          });
        }
        if (item.anniversary) {
          events.push({
            id: `${item.id}-anniversary`,
            type: 'anniversary',
            date: item.anniversary,
            label: 'Годовщина',
          });
        }
        return events;
      });

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Ошибка загрузки дат:', error);
      toast.error('Не удалось загрузить даты');
    }
  }

  function addRow() {
    setEvents((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, label: '', type: 'other', date: '' },
    ]);
    window.gtag?.('event', 'add_important_date', { event_category: 'account' });
    window.ym?.(12345678, 'reachGoal', 'add_important_date');
  }

  async function saveDates() {
    if (!userId) {
      toast.error('Авторизуйтесь для сохранения дат');
      return;
    }

    // Проверяем, что все поля заполнены
    const isValid = events.every((e) => e.label.trim() && e.type.trim() && e.date.trim());
    if (!isValid) {
      toast.error('Пожалуйста, заполните все поля для каждого события');
      return;
    }

    try {
      // Преобразуем события в формат Supabase
      const payload = events.map((e) => ({
        id: e.id.startsWith('temp-') ? undefined : e.id.split('-')[0], // Убираем суффикс для существующих записей
        user_id: userId,
        anniversary: e.type === 'anniversary' ? e.date : null,
        birthday: e.type === 'birthday' ? e.date : null,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('important_dates')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('Ошибка сохранения дат:', error);
        toast.error('Ошибка сохранения дат');
        return;
      }

      toast.success('Даты успешно сохранены');
      window.gtag?.('event', 'save_important_dates', {
        event_category: 'account',
        event_label: `Сохранено ${events.length} дат`,
        count: events.length,
      });
      window.ym?.(12345678, 'reachGoal', 'save_important_dates', {
        count: events.length,
      });
    } catch (error) {
      console.error('Ошибка сохранения дат:', error);
      toast.error('Не удалось сохранить даты');
    }
  }

  async function deleteEvent(id: string) {
    if (!userId) {
      toast.error('Авторизуйтесь для удаления дат');
      return;
    }

    try {
      const actualId = id.split('-')[0]; // Получаем оригинальный ID записи
      const { error } = await supabase
        .from('important_dates')
        .delete()
        .eq('id', actualId)
        .eq('user_id', userId);

      if (error) {
        console.error('Ошибка удаления события:', error);
        toast.error('Ошибка удаления события');
        return;
      }

      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('Событие удалено');
      window.gtag?.('event', 'delete_important_date', { event_category: 'account' });
      window.ym?.(12345678, 'reachGoal', 'delete_important_date');
    } catch (error) {
      console.error('Ошибка удаления события:', error);
      toast.error('Не удалось удалить событие');
    }
  }

  const handleEventChange = (updatedEvent: Event) => {
    setEvents((prev) => prev.map((x) => (x.id === updatedEvent.id ? updatedEvent : x)));
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
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
          <EventCard
            key={e.id}
            event={e}
            onChange={handleEventChange}
            onDelete={deleteEvent}
          />
        ))}
      </div>
      <div className="space-y-2">
        <motion.button
          onClick={saveDates}
          className="w-full lg:w-auto lg:px-6 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
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