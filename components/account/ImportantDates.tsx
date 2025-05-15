// ✅ Путь: components/account/ImportantDates.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import type { Database } from '@/lib/supabase/types_new';

interface Event {
  id?: string;
  whose: string;
  type: string;
  date: string;
}

interface ImportantDatesProps {
  phone: string;
  onUpdate?: () => void;
}

export default function ImportantDates({ phone, onUpdate }: ImportantDatesProps) {
  const [events, setEvents] = useState<Event[]>([
    { whose: '', type: 'День рождения', date: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Accept: 'application/json',
        },
      },
    }
  );

  useEffect(() => {
    const fetchDates = async () => {
      const { data, error } = await supabase
        .from('important_dates')
        .select('id, whose, type, date')
        .eq('user_id', phone);

      if (error) {
        console.error('Error fetching important dates:', error);
        toast.error('Ошибка загрузки дат');
        return;
      }

      if (data && data.length > 0) {
        setEvents(data as Event[]); // Приводим тип явно
      }
    };

    fetchDates();
  }, [phone, supabase]);

  const handleAddEvent = () => {
    if (events.length < 10) {
      setEvents([...events, { whose: '', type: 'День рождения', date: '' }]);
    } else {
      toast.error('Максимум 10 событий');
    }
  };

  const handleEventChange = (index: number, field: keyof Event, value: string) => {
    const updatedEvents = [...events];
    updatedEvents[index] = { ...updatedEvents[index], [field]: value };
    setEvents(updatedEvents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Удаляем существующие записи
      const { error: deleteError } = await supabase
        .from('important_dates')
        .delete()
        .eq('user_id', phone);

      if (deleteError) {
        throw new Error(`Error deleting existing dates: ${deleteError.message}`);
      }

      // Фильтруем события, где заполнены все поля
      const validEvents = events.filter((event) => event.whose && event.type && event.date);

      if (validEvents.length === 0) {
        toast.success('Даты успешно сохранены.');
        if (onUpdate) {
          onUpdate();
        }
        return;
      }

      // Проверяем, были ли даты ранее
      const { count: previousCount, error: countError } = await supabase
        .from('important_dates')
        .select('id', { count: 'exact' })
        .eq('user_id', phone);

      if (countError) {
        throw new Error(`Error counting existing dates: ${countError.message}`);
      }

      const wasEmptyBefore = previousCount === 0;
      const hasNewData = validEvents.length > 0;

      // Сохраняем новые события
      const { error: insertError } = await supabase
        .from('important_dates')
        .insert(
          validEvents.map((event) => ({
            user_id: phone,
            whose: event.whose,
            type: event.type,
            date: event.date,
          }))
        );

      if (insertError) {
        throw new Error(`Error saving dates: ${insertError.message}`);
      }

      // Если это первое заполнение, начисляем бонусы
      if (wasEmptyBefore && hasNewData) {
        const { data: bonusRecord, error: bonusError } = await supabase
          .from('bonuses')
          .select('id, bonus_balance')
          .eq('phone', phone)
          .single();

        if (bonusError && bonusError.code !== 'PGRST116') {
          throw new Error(`Error fetching bonus record: ${bonusError.message}`);
        }

        let bonusId: string;
        let currentBalance: number = 0;
        if (!bonusRecord) {
          const { data: newBonus, error: insertErr } = await supabase
            .from('bonuses')
            .insert({
              phone,
              bonus_balance: 0,
              level: 'bronze',
              total_spent: 0,
              total_bonus: 0,
              updated_at: new Date().toISOString(),
            })
            .select('id, bonus_balance')
            .single();

          if (insertErr) {
            throw new Error(`Error creating bonus record: ${insertErr.message}`);
          }
          bonusId = newBonus.id;
          currentBalance = newBonus.bonus_balance ?? 0;
        } else {
          bonusId = bonusRecord.id;
          currentBalance = bonusRecord.bonus_balance ?? 0;
        }

        const bonusToAdd = 100;
        const newBalance = currentBalance + bonusToAdd;

        const { error: updateErr } = await supabase
          .from('bonuses')
          .update({
            bonus_balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('phone', phone);

        if (updateErr) {
          throw new Error(`Error updating bonus balance: ${updateErr.message}`);
        }

        const { error: historyErr } = await supabase
          .from('bonus_history')
          .insert({
            bonus_id: bonusId,
            amount: bonusToAdd,
            reason: 'Бонус за указание важных дат',
            created_at: new Date().toISOString(),
          });

        if (historyErr) {
          console.error('Error logging bonus history:', historyErr);
        }

        toast.success('Даты сохранены! Начислено 100 бонусов.');
      } else {
        toast.success('Даты успешно сохранены.');
      }

      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error saving important dates:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg font-semibold mb-4">Важные даты</h3>
      <p className="text-sm text-gray-500 mb-4">
        Заполните важные даты своих близких и получите персональную скидку на каждый праздник! Это могут быть как дни рождения и годовщины, так и просто особенные дни для Вас. Мы заранее напомним о важных событиях, чтобы Вы не забыли поздравить близких, и подарим скидку на оформление заказа.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor={`whose-${index}`} className="block text-sm font-medium text-gray-700">
                Чьё событие
              </label>
              <input
                type="text"
                id={`whose-${index}`}
                value={event.whose}
                onChange={(e) => handleEventChange(index, 'whose', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                placeholder="Чьё событие"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor={`type-${index}`} className="block text-sm font-medium text-gray-700">
                Тип события
              </label>
              <select
                id={`type-${index}`}
                value={event.type}
                onChange={(e) => handleEventChange(index, 'type', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                disabled={isLoading}
              >
                <option value="День рождения">День рождения</option>
                <option value="Годовщина">Годовщина</option>
                <option value="Особенный день">Особенный день</option>
              </select>
            </div>
            <div>
              <label htmlFor={`date-${index}`} className="block text-sm font-medium text-gray-700">
                Дата
              </label>
              <input
                type="date"
                id={`date-${index}`}
                value={event.date}
                onChange={(e) => handleEventChange(index, 'date', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                disabled={isLoading}
              />
            </div>
          </div>
        ))}
        {events.length < 10 && (
          <button
            type="button"
            onClick={handleAddEvent}
            className="text-sm text-blue-600 hover:underline"
            disabled={isLoading}
          >
            + Добавить событие
          </button>
        )}
        <motion.button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </motion.button>
      </form>
    </motion.div>
  );
}