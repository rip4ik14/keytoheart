// app/admin/(protected)/layout.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

export default function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = [
    { href: '/admin', label: '🏠 Главная' },
    { href: '/admin/products', label: '📦 Товары' },
    { href: '/admin/orders', label: '🧾 Заказы' },
    { href: '/admin/customers', label: '👥 Клиенты' },
    { href: '/admin/promo', label: '🏷️ Промо-блоки' },
    { href: '/admin/promo-codes', label: '💸 Промокоды' },
    { href: '/admin/categories', label: '📁 Категории' },
    { href: '/admin/settings', label: '⚙️ Настройки' },
    { href: '/admin/stats', label: '📊 Статистика' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <motion.aside
        className="w-64 bg-white border-r p-6 hidden md:block"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, x: -10 },
          visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.3, staggerChildren: 0.1 },
          },
        }}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">Админ-панель</h2>
          <form method="POST" action="/api/admin-logout">
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-black"
            >
              Выйти
            </button>
          </form>
        </div>
        <nav className="space-y-4 text-sm">
          {navItems.map(({ href, label }) => (
            <motion.div
              key={href}
              variants={{
                hidden: { opacity: 0, x: -5 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
              }}
            >
              <Link
                href={href}
                className="block hover:text-black focus:outline-none focus:ring-2 focus:ring-black"
              >
                {label}
              </Link>
            </motion.div>
          ))}
        </nav>
        <motion.div
          variants={{
            hidden: { opacity: 0, x: -5 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
          }}
          className="mt-6"
        >
          <Link
            href="/"
            className="text-gray-400 text-xs hover:text-black focus:outline-none focus:ring-2 focus:ring-black"
          >
            ← Вернуться на сайт
          </Link>
        </motion.div>
      </motion.aside>

      {/* Mobile toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen((o) => !o)}
          className="p-4 focus:outline-none focus:ring-4 focus:ring-black"
        >
          <Image
            src={isMobileMenuOpen ? '/icons/times.svg' : '/icons/bars.svg'}
            alt={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            width={24}
            height={24}
          />
        </button>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 left-0 w-64 h-full bg-white border-r p-6 z-50"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Админ-панель</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <Image src="/icons/times.svg" alt="Закрыть" width={20} height={20} />
                </button>
              </div>
              <nav className="space-y-4 text-sm">
                {navItems.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block hover:text-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <form method="POST" action="/api/admin-logout" className="mt-6">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  Выйти
                </button>
              </form>
              <Link
                href="/"
                className="block text-gray-400 mt-6 text-xs hover:text-black focus:outline-none focus:ring-2 focus:ring-black"
              >
                ← На главную
              </Link>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 bg-white overflow-auto">{children}</main>
    </div>
  );
}