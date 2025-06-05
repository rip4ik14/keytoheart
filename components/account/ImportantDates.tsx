'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface ImportantDatesProps {
  phone: string;
  onUpdate: () => void;
}

interface Event {
  type: string;
  date: string;
  description: string;
}

export default function ImportantDates({ phone, onUpdate }: ImportantDatesProps) {
  const [events, setEvents] = useState<Event[]>([
    { type: 'День рождения', date: '', description: '' },
    { type: 'Годовщина', date: '', description: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await fetch(`/api/account/important-dates?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (data.success && data.data) {
          setEvents(
            data.data.length > 0
              ? data.data.map((item: { type: string; date: string; description: string }) => ({
                  type: item.type,
                  date: item.date || '',
                  description: item.description || '',
                }))
              : [
                  { type: 'День рождения', date: '', description: '' },
                  { type: 'Годовщина', date: '', description: '' },
                ]
          );
        } else {
          throw new Error(data.error || 'Ошибка загрузки дат');
        }
      } catch (error) {
        process.env.NODE_ENV !== "production" && console.error('Error fetching important dates:', error);
        toast.error('Не удалось загрузить важные даты');
      }
    };

    fetchDates();
  }, [phone]);

  const handleAddEvent = () => {
    setEvents([...events, { type: 'Другое', date: '', description: '' }]);
  };

  const handleEventChange = (index: number, field: keyof Event, value: string) => {
    const updatedEvents = [...events];
    updatedEvents[index] = { ...updatedEvents[index], [field]: value };
    setEvents(updatedEvents);
  };

  const handleRemoveEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/account/important-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          events: events.map((event) => ({
            type: event.type,
            date: event.date || null,
            description: event.description || null,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка обновления дат');
      }

      toast.success('Даты успешно обновлены!');
      onUpdate();
    } catch (error: any) {
      process.env.NODE_ENV !== "production" && console.error('Error saving important dates:', error);
      toast.error(`Ошибка: ${error.message || 'Не удалось сохранить даты'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.section
      className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      aria-labelledby="important-dates-title"
    >
      <h2 id="important-dates-title" className="text-lg font-semibold mb-4 sm:text-xl">
        Важные даты
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Укажите важные даты, такие как день рождения или годовщина, и мы напомним вам о них, а также подарим скидку!
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {events.map((event, index) => (
          <motion.div
            key={index}
            className="space-y-4 border-b pb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div>
              <label htmlFor={`event-type-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Тип события
              </label>
              <select
                id={`event-type-${index}`}
                value={event.type}
                onChange={(e) => handleEventChange(index, 'type', e.target.value)}
                className="border border-gray-300 px-4 py-2 rounded w-full text-black focus:outline-none focus:ring-2 focus:ring-black sm:p-3"
                disabled={isLoading}
              >
                <option value="День рождения">День рождения</option>
                <option value="Годовщина">Годовщина</option>
                <option value="Другое">Другое</option>
              </select>
            </div>
            <div>
              <label htmlFor={`event-date-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Дата
              </label>
              <input
                id={`event-date-${index}`}
                type="date"
                value={event.date}
                onChange={(e) => handleEventChange(index, 'date', e.target.value)}
                className="border border-gray-300 px-4 py-2 rounded w-full text-black focus:outline-none focus:ring-2 focus:ring-black sm:p-3"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor={`event-description-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Описание (опционально)
              </label>
              <textarea
                id={`event-description-${index}`}
                value={event.description}
                onChange={(e) => handleEventChange(index, 'description', e.target.value)}
                className="border border-gray-300 px-4 py-2 rounded w-full text-black focus:outline-none focus:ring-2 focus:ring-black sm:p-3"
                placeholder="Например, день рождения жены"
                disabled={isLoading}
                maxLength={200}
              />
            </div>
            {events.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemoveEvent(index)}
                className="text-sm text-red-600 hover:underline"
                disabled={isLoading}
              >
                Удалить событие
              </button>
            )}
          </motion.div>
        ))}
        <div className="flex justify-between items-center">
          <motion.button
            type="button"
            onClick={handleAddEvent}
            disabled={isLoading}
            className="text-sm text-black hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Добавить событие
          </motion.button>
          <motion.button
            type="submit"
            disabled={isLoading}
            className={`bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition-all sm:w-auto sm:px-6 sm:py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Сохранить важные даты"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </motion.button>
        </div>
      </form>
    </motion.section>
  );
}