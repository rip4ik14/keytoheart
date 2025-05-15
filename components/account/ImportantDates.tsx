'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import type { Database } from '@/lib/supabase/types_new';

interface ImportantDatesProps {
  phone: string;
  onUpdate?: () => void;
}

export default function ImportantDates({ phone, onUpdate }: ImportantDatesProps) {
  const [birthday, setBirthday] = useState<string>('');
  const [anniversary, setAnniversary] = useState<string>('');
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
        .select('birthday, anniversary')
        .eq('user_id', phone)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching important dates:', error);
        toast.error('Ошибка загрузки дат');
        return;
      }

      if (data) {
        setBirthday(data.birthday || '');
        setAnniversary(data.anniversary || '');
      }
    };

    fetchDates();
  }, [phone, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Проверяем, были ли даты уже заполнены
      const { data: existingDates, error: fetchError } = await supabase
        .from('important_dates')
        .select('birthday, anniversary')
        .eq('user_id', phone)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Error fetching existing dates: ${fetchError.message}`);
      }

      const wasEmptyBefore = !existingDates || (!existingDates.birthday && !existingDates.anniversary);
      const hasNewData = (birthday && !existingDates?.birthday) || (anniversary && !existingDates?.anniversary);

      // Сохраняем даты
      const { error: upsertError } = await supabase
        .from('important_dates')
        .upsert(
          { user_id: phone, birthday: birthday || null, anniversary: anniversary || null, created_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      if (upsertError) {
        throw new Error(`Error saving dates: ${upsertError.message}`);
      }

      // Если даты заполнены впервые, начисляем бонусы
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
        let currentBalance: number = 0; // Явно задаём тип number
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
          currentBalance = newBonus.bonus_balance ?? 0; // Используем ?? для обработки null
        } else {
          bonusId = bonusRecord.id;
          currentBalance = bonusRecord.bonus_balance ?? 0; // Используем ?? для обработки null
        }

        const bonusToAdd = 100; // Например, 100 бонусов за заполнение дат
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
        Укажите день рождения и юбилей — мы напомним и подарим скидку.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">
            День рождения
          </label>
          <input
            type="date"
            id="birthday"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="anniversary" className="block text-sm font-medium text-gray-700">
            Юбилей
          </label>
          <input
            type="date"
            id="anniversary"
            value={anniversary}
            onChange={(e) => setAnniversary(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
          />
        </div>
        <motion.button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? 'Сохранение...' : 'Заполнить'}
        </motion.button>
      </form>
    </motion.div>
  );
}
