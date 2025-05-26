// Путь: app/admin/(protected)/layout.tsx

import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { verifyAdminJwt } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  // SSR-проверка авторизации
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const isAuthed = token ? verifyAdminJwt(token) : false;

  if (!isAuthed) {
    redirect('/admin/login?error=no-session');
  }

  // Ваша верстка сайдбара
  const containerVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -5 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  };

  return (
    <html>
      <body>
        <div className="flex min-h-screen bg-gray-50">
          {/* Десктопный сайдбар */}
          <motion.aside
            className="w-64 bg-white border-r p-6 hidden md:block"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tight">Админ-панель</h2>
              <form method="POST" action="/api/admin-logout">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-black transition duration-200 focus:ring-2 focus:ring-black"
                >
                  Выйти
                </button>
              </form>
            </div>
            <nav className="space-y-4 text-sm">
              {[
                ['🏠', 'Главная', '/admin'],
                ['📦', 'Товары', '/admin/products'],
                ['🧾', 'Заказы', '/admin/orders'],
                ['👥', 'Клиенты', '/admin/customers'],
                ['🏷️', 'Промо-блоки', '/admin/promo'],
                ['💸', 'Промокоды', '/admin/promo-codes'],
                ['📁', 'Категории', '/admin/categories'],
                ['⚙️', 'Настройки', '/admin/settings'],
                ['📊', 'Статистика', '/admin/stats'],
              ].map(([icon, label, href]) => (
                <motion.div key={href} variants={itemVariants}>
                  <Link
                    href={href as string}
                    className="flex items-center gap-2 hover:text-black transition duration-200 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div variants={itemVariants} className="mt-6">
              <Link
                href="/"
                className="text-gray-400 text-xs hover:text-black transition duration-200 focus:outline-none focus:ring-2 focus:ring-black"
              >
                ← Вернуться на сайт
              </Link>
            </motion.div>
          </motion.aside>

          {/* Основной контент */}
          <main className="flex-1 p-6 bg-white overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
