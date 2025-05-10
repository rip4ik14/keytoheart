'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface PersonalFormProps {
  onUpdate: () => Promise<void>;
  phone: string;
}

export default function PersonalForm({ onUpdate, phone }: PersonalFormProps) {
  const [name, setName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!phone) {
        setError('Номер телефона не найден. Пожалуйста, авторизуйтесь заново.');
        toast.error('Номер телефона не найден');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/account/get-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });

        const result = await response.json();
        console.log('Response from /api/account/get-profile:', result); // Добавляем отладку
        if (!result.success) {
          console.error('Ошибка загрузки профиля:', result.error);
          setError('Ошибка загрузки данных профиля');
          toast.error('Ошибка загрузки данных профиля');
          return;
        }

        setName(result.name || '');
        console.log('Loaded name:', result.name || ''); // Добавляем отладку
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setError('Не удалось загрузить данные');
        toast.error('Не удалось загрузить данные');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone) {
      setError('Номер телефона не найден. Пожалуйста, авторизуйтесь заново.');
      toast.error('Номер телефона не найден');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Введите ваше имя');
      toast.error('Введите ваше имя');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Имя не должно превышать 50 символов');
      toast.error('Имя не должно превышать 50 символов');
      return;
    }

    setIsLoading(true);
    try {
      // Защита от XSS
      const sanitizedName = trimmedName.replace(/[<>&'"]/g, '');

      // Обновляем профиль через API
      const response = await fetch('/api/account/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: sanitizedName }),
      });

      const result = await response.json();
      console.log('Response from /api/account/update-profile:', result); // Добавляем отладку
      if (!result.success) {
        console.error('Ошибка обновления профиля:', result.error);
        throw new Error(result.error || 'Ошибка обновления профиля');
      }

      toast.success('Данные успешно обновлены');
      await onUpdate();

      window.gtag?.('event', 'update_profile', { event_category: 'account', value: sanitizedName });
      window.ym?.(12345678, 'reachGoal', 'update_profile', { name: sanitizedName });
    } catch (error: any) {
      console.error('Ошибка обновления профиля:', error);
      setError(error.message || 'Ошибка обновления данных');
      toast.error(error.message || 'Ошибка обновления данных');
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
      aria-labelledby="personal-form-title"
    >
      <h2 id="personal-form-title" className="text-lg font-semibold mb-4 sm:text-xl">
        Личные данные
      </h2>
      {error ? (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Имя
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded w-full text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black sm:p-3"
              placeholder="Введите ваше имя"
              aria-label="Введите ваше имя"
              maxLength={50}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              id="phone"
              type="text"
              value={phone || 'Не указан'}
              disabled
              className="border border-gray-300 px-4 py-2 rounded w-full bg-gray-100 text-gray-500 sm:p-3 cursor-not-allowed"
              aria-label="Ваш номер телефона (нельзя изменить)"
            />
          </div>
          <motion.button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition-all sm:w-auto sm:px-6 sm:py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Сохранить изменения профиля"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </motion.button>
        </form>
      )}
    </motion.section>
  );
}