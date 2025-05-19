'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ImportantDatesProps {
  phone: string;
  onUpdate: () => void;
}

export default function ImportantDates({ phone, onUpdate }: ImportantDatesProps) {
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await fetch(`/api/account/important-dates?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (data.success) {
          setBirthday(data.data?.birthday || '');
          setAnniversary(data.data?.anniversary || '');
        }
      } catch (error) {
        console.error('Error fetching important dates:', error);
      }
    };

    fetchDates();
  }, [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/account/important-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, birthday, anniversary }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка обновления дат');
      }

      toast.success('Даты обновлены!');
      onUpdate();
    } catch (error: any) {
      console.error('Error saving important dates:', error);
      toast.error(`Ошибка обновления дат: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">
          День рождения
        </label>
        <input
          id="birthday"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="anniversary" className="block text-sm font-medium text-gray-700">
          Годовщина
        </label>
        <input
          id="anniversary"
          type="date"
          value={anniversary}
          onChange={(e) => setAnniversary(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 bg-black text-white rounded-md disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Сохранение...' : 'Сохранить'}
      </button>
    </form>
  );
}