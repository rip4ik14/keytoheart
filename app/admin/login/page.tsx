// app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('from') || '/admin/products';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(redirectTo);
    } else {
      setError(data.error || 'Неверный пароль');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl mb-6 text-center">Вход в админку</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <label className="block mb-4">
          Пароль:
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
            placeholder="Введите пароль"
          />
        </label>
        <button
          type="submit"
          className="w-full py-2 bg-black text-white rounded hover:opacity-90 transition"
        >
          Войти
        </button>
      </form>
    </div>
  );
}
