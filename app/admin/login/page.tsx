'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabasePublic } from '@/lib/supabase/client';
import jwt from 'jsonwebtoken';

export default function AdminLogin() {
  const [email, setEmail] = useState('rip4inskiy@yandex.ru');
  const [password, setPassword] = useState('335460852');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Введите email и пароль');
      return;
    }

    const { error: signInError, data } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('AdminLogin: Sign-in error:', signInError.message);
      setError('Неверный email или пароль');
      return;
    }

    // Создаем JWT-токен
    try {
      const token = jwt.sign({ userId: data.user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
      document.cookie = `admin_session=${token}; path=/; max-age=3600; SameSite=Strict`;
      console.log('AdminLogin: JWT token set, redirecting to /admin');
    } catch (jwtError) {
      console.error('AdminLogin: JWT creation error:', jwtError);
      setError('Ошибка создания сессии');
      return;
    }

    router.push('/admin');
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-sans font-bold mb-6 text-center">
          Вход в админ-панель
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              placeholder="rip4inskiy@yandex.ru"
              required
              aria-describedby={error ? 'email-error' : undefined}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              required
              aria-describedby={error ? 'password-error' : undefined}
            />
            {error && (
              <p id="error" className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
          <motion.button
            type="submit"
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Войти
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}