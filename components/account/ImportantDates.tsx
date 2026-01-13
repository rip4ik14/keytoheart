'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import UiButton from '@components/ui/UiButton';
import { Plus, Trash2 } from 'lucide-react';

interface ImportantDatesProps {
  phone: string;
  onUpdate: () => void;
}

interface Event {
  type: string;
  date: string;
  description: string;
  customType?: string;
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
                  customType:
                    item.type !== 'День рождения' && item.type !== 'Годовщина' ? item.type : '',
                }))
              : [
                  { type: 'День рождения', date: '', description: '' },
                  { type: 'Годовщина', date: '', description: '' },
                ],
          );
        } else {
          throw new Error(data.error || 'Ошибка загрузки дат');
        }
      } catch (error) {
        process.env.NODE_ENV !== 'production' && console.error('Error fetching important dates:', error);
        toast.error('Не удалось загрузить важные даты');
      }
    };

    fetchDates();
  }, [phone]);

  const handleAddEvent = () => {
    setEvents([...events, { type: 'Другое', date: '', description: '', customType: '' }]);
  };

  const handleEventChange = (index: number, field: keyof Event, value: string) => {
    const updated = [...events];

    if (field === 'type' && value !== 'Другое') {
      updated[index] = { ...updated[index], type: value, customType: '' };
    } else if (field === 'customType') {
      updated[index] = { ...updated[index], type: value || 'Другое', customType: value };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    setEvents(updated);
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
      if (!res.ok || !data.success) throw new Error(data.error || 'Ошибка обновления дат');

      toast.success('Даты успешно обновлены!');
      onUpdate();
    } catch (error: any) {
      process.env.NODE_ENV !== 'production' && console.error('Error saving important dates:', error);
      toast.error(`Ошибка: ${error.message || 'Не удалось сохранить даты'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.section
      className="rounded-3xl border border-black/10 bg-white p-4 sm:p-5 lg:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-labelledby="important-dates-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="important-dates-title" className="text-lg font-semibold tracking-tight sm:text-xl">
            Важные даты
          </h2>
          <p className="text-sm text-black/55 mt-1">
            Укажите даты - и мы напомним вам, а также подарим приятный бонус
          </p>
        </div>

        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/5 border border-black/10">
          Напоминания
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {events.map((event, index) => {
          const isCustom = event.type !== 'День рождения' && event.type !== 'Годовщина';

          return (
            <div
              key={index}
              className="rounded-3xl border border-black/10 bg-white p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-black/80">
                  Событие {index + 1}
                </div>

                {events.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(index)}
                    className="inline-flex items-center gap-2 text-sm text-rose-700 hover:underline"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-black/75 mb-1">
                    Тип
                  </label>
                  <select
                    value={event.type === 'День рождения' || event.type === 'Годовщина' ? event.type : 'Другое'}
                    onChange={(e) => handleEventChange(index, 'type', e.target.value)}
                    className="
                      w-full rounded-2xl border border-black/10 bg-white
                      px-4 py-3 text-sm
                      focus:outline-none focus:ring-2 focus:ring-black/20
                    "
                    disabled={isLoading}
                  >
                    <option value="День рождения">День рождения</option>
                    <option value="Годовщина">Годовщина</option>
                    <option value="Другое">Другое</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black/75 mb-1">
                    Дата
                  </label>
                  <input
                    type="date"
                    value={event.date}
                    onChange={(e) => handleEventChange(index, 'date', e.target.value)}
                    className="
                      w-full rounded-2xl border border-black/10 bg-white
                      px-4 py-3 text-sm
                      focus:outline-none focus:ring-2 focus:ring-black/20
                    "
                    disabled={isLoading}
                  />
                </div>
              </div>

              {isCustom && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-black/75 mb-1">
                    Укажите событие
                  </label>
                  <input
                    type="text"
                    value={event.customType || ''}
                    onChange={(e) => handleEventChange(index, 'customType', e.target.value)}
                    className="
                      w-full rounded-2xl border border-black/10 bg-white
                      px-4 py-3 text-sm
                      placeholder-black/35
                      focus:outline-none focus:ring-2 focus:ring-black/20
                    "
                    placeholder="Например, день свадьбы"
                    disabled={isLoading}
                    maxLength={50}
                  />
                </div>
              )}

              <div className="mt-3">
                <label className="block text-sm font-semibold text-black/75 mb-1">
                  Описание (опционально)
                </label>
                <textarea
                  value={event.description}
                  onChange={(e) => handleEventChange(index, 'description', e.target.value)}
                  className="
                    w-full rounded-2xl border border-black/10 bg-white
                    px-4 py-3 text-sm
                    placeholder-black/35
                    focus:outline-none focus:ring-2 focus:ring-black/20
                  "
                  placeholder="Например, день рождения жены"
                  disabled={isLoading}
                  maxLength={200}
                  rows={3}
                />
              </div>
            </div>
          );
        })}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-1">
          <UiButton
            type="button"
            variant="brandOutline"
            onClick={handleAddEvent}
            disabled={isLoading}
            className="rounded-2xl px-6 py-3"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Добавить событие
            </span>
          </UiButton>

          <UiButton
            type="submit"
            variant="brand"
            disabled={isLoading}
            className="rounded-2xl px-6 py-3"
            aria-label="Сохранить важные даты"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </UiButton>
        </div>
      </form>
    </motion.section>
  );
}
