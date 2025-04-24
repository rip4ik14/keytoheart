// файл: app/admin/layout.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    // Удаляем HTTP-only куку через API
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Сайдбар */}
      <aside className="w-64 bg-white border-r p-6 hidden md:block">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">Админ‑панель</h2>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-black transition"
          >
            Выйти
          </button>
        </div>
        <nav className="space-y-4 text-sm">
          <Link href="/admin/products" className="block hover:text-black">📦 Товары</Link>
          <Link href="/admin/promo" className="block hover:text-black">🏷️ Промо‑блоки</Link>
          <Link href="/admin/categories" className="block hover:text-black">📁 Категории</Link>
          <Link href="/admin/orders" className="block hover:text-black">🧾 Заказы</Link>
          <Link href="/admin/promos" className="block hover:text-black">💸 Промокоды</Link>
          <Link href="/admin/stats" className="block hover:text-black">📊 Статистика</Link>
        </nav>
        <Link
          href="/"
          className="block text-gray-400 mt-6 text-xs hover:text-black"
        >
          ← Вернуться на сайт
        </Link>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 p-6 bg-white overflow-auto">{children}</main>
    </div>
  );
}
