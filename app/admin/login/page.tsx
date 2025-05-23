'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('from') || '/admin/products';
  const error = params.get('error');

  useEffect(() => {
    if (error === 'no-session') {
      toast.error('Пожалуйста, войдите в систему');
    } else if (error === 'invalid-session') {
      toast.error('Сессия истекла, войдите снова');
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Успешный вход');
        setTimeout(() => {
          router.push(redirectTo);
          router.refresh();
        }, 1000);
      } else {
        throw new Error(data.message || 'Неверный пароль');
      }
    } catch (err: any) {
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-labelledby="login-title"
      >
        <h1 id="login-title" className="text-2xl mb-6 text-center">
          Вход в админ-панель
        </h1>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-1">
            Пароль:
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
            placeholder="Введите пароль"
            disabled={loading}
            required
            aria-describedby="password-desc"
          />
          <p id="password-desc" className="text-sm text-gray-500 mt-1">
            Введите пароль для доступа к админ-панели.
          </p>
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-black text-white rounded transition disabled:bg-gray-500"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Войти в админ-панель"
        >
          {loading ? 'Вход...' : 'Войти'}
        </motion.button>
      </motion.form>
    </div>
  );
}