// ✅ Путь: components/account/PersonalForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import type { Database } from '@/lib/supabase/types_new';

interface PersonalFormProps {
  onUpdate: () => Promise<void>;
}

export default function PersonalForm({ onUpdate }: PersonalFormProps) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setName(session.user.user_metadata?.name || '');
        setPhone(session.user.user_metadata?.phone || '');
      }
    };

    fetchUserData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name, phone },
      });

      if (error) throw error;

      toast.success('Данные успешно обновлены');
      await onUpdate(); // Вызываем onUpdate для обновления данных в родительском компоненте
    } catch (error: any) {
      toast.error('Ошибка обновления данных: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Личные данные</h2>
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
            className="border border-gray-300 px-4 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Введите ваше имя"
            aria-label="Имя"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Телефон
          </label>
          <input
            id="phone"
            type="text"
            value={phone}
            disabled
            className="border border-gray-300 px-4 py-2 rounded w-full bg-gray-100 cursor-not-allowed"
            aria-label="Телефон (нельзя изменить)"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
          aria-label="Сохранить изменения"
        >
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </section>
  );
}