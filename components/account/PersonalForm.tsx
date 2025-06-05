'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface PersonalFormProps {
  onUpdate: () => Promise<void>;
  phone: string;
}

interface ProfileData {
  name: string | null;
  last_name: string | null;
  email: string | null;
  birthday: string | null;
  receive_offers: boolean | null;
}

export default function PersonalForm({ onUpdate, phone }: PersonalFormProps) {
  const [name, setName] = useState<string>('Денис');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [birthday, setBirthday] = useState<string>('');
  const [receiveOffers, setReceiveOffers] = useState<boolean>(false);
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
        const res = await fetch(`/api/account/profile?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (data.success && data.data) {
          const profileData: ProfileData = data.data;
          setName(profileData.name || 'Денис');
          setLastName(profileData.last_name || '');
          setEmail(profileData.email || '');
          setBirthday(profileData.birthday || '');
          setReceiveOffers(profileData.receive_offers || false);
        } else {
          throw new Error(data.error || 'Ошибка загрузки данных профиля');
        }
      } catch (error) {
        process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки данных:', error);
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

    const trimmedLastName = lastName.trim();
    if (trimmedLastName.length > 50) {
      setError('Фамилия не должна превышать 50 символов');
      toast.error('Фамилия не должна превышать 50 символов');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Введите корректный email');
      toast.error('Введите корректный email');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          name: trimmedName,
          last_name: trimmedLastName,
          email: trimmedEmail,
          birthday,
          receive_offers: receiveOffers,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка обновления профиля');
      }

      toast.success('Данные успешно обновлены');
      await onUpdate();

      window.gtag?.('event', 'update_profile', { event_category: 'account', value: trimmedName });
      window.ym?.(96644553, 'reachGoal', 'update_profile', { name: trimmedName });
    } catch (error: any) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка обновления профиля:', error);
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
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Фамилия
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded w-full text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black sm:p-3"
              placeholder="Фамилия"
              aria-label="Введите вашу фамилию"
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
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded w-full text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black sm:p-3"
              placeholder="E-mail"
              aria-label="Введите ваш email"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
              Дата рождения
            </label>
            <input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded w-full text-black focus:outline-none focus:ring-2 focus:ring-black sm:p-3"
              aria-label="Введите вашу дату рождения"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center">
            <input
              id="receiveOffers"
              type="checkbox"
              checked={receiveOffers}
              onChange={(e) => setReceiveOffers(e.target.checked)}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="receiveOffers" className="ml-2 block text-sm text-gray-700">
              Я согласен получать рекламные предложения
            </label>
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