// app/admin/login/page.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

function LoginContent() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('from') || '/admin/products';
  const error = params.get('error');

  useEffect(() => {
    process.env.NODE_ENV !== "production" &&
      console.log(`${new Date().toISOString()} AdminLoginPage: Loaded with params`, {
      error,
      redirectTo,
    });

    if (error === 'no-session') {
      toast.error('Пожалуйста, войдите в систему');
    } else if (error === 'invalid-session') {
      toast.error('Сессия истекла, войдите снова');
    }

    // Проверка сессии только один раз
    if (!hasCheckedSession) {
      const checkSession = async () => {
        try {
          process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} AdminLoginPage: Checking session`);
          const res = await fetch('/api/admin-session', {
            credentials: 'include',
            cache: 'no-store',
          });
          const data = await res.json();
          process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} AdminLoginPage: Session check response`, data);
          if (res.ok && data.success) {
            process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} AdminLoginPage: Redirecting to ${redirectTo}`);
            window.location.href = redirectTo; // Принудительное перенаправление
            return;
          }
          // Если сессия недействительна, очищаем куку
          if (data.error === 'NEAUTH') {
            process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} AdminLoginPage: Clearing invalid admin_session cookie`);
            document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
        } catch (err) {
          process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} AdminLoginPage: Session check error`, err);
        } finally {
          setHasCheckedSession(true);
        }
      };
      checkSession();
    }
  }, [error, redirectTo, hasCheckedSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} AdminLoginPage: Submitting login form`, { password });

    try {
      // Очищаем старую куку перед новым логином
      document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      process.env.NODE_ENV !== "production" &&
        console.log(`${new Date().toISOString()} AdminLoginPage: Cleared admin_session cookie before login`);

      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });

      const data = await res.json();
      process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} AdminLoginPage: Login response`, data);

      if (res.ok && data.success) {
        toast.success('Успешный вход');
        setTimeout(() => {
          process.env.NODE_ENV !== "production" && console.log(`${new Date().toISOString()} AdminLoginPage: Redirecting to ${redirectTo}`);
          window.location.href = redirectTo; // Принудительное перенаправление
        }, 1000);
      } else {
        throw new Error(data.message || 'Неверный пароль');
      }
    } catch (err: any) {
      process.env.NODE_ENV !== "production" && console.error(`${new Date().toISOString()} AdminLoginPage: Login error`, err.message);
      toast.error(`Ошибка: ${err.message}`);
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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <LoginContent />
    </Suspense>
  );
}