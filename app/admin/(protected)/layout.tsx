'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const containerVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -5 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Десктопная боковая панель */}
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
              className="text-sm text-gray-500 hover:text-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              aria-label="Выйти из админ-панели"
            >
              Выйти
            </button>
          </form>
        </div>
        <nav className="space-y-4 text-sm">
          <motion.div variants={itemVariants}>
            <Link href="/admin" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Главная страница админ-панели">
              🏠 Главная
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/admin/products" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление товарами">
              📦 Товары
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/admin/orders" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление заказами">
              🧾 Заказы
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/admin/customers" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление клиентами">
              👥 Клиенты
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/admin/promo" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление промо-блоками">
              🏷️ Промо-блоки
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/admin/promo-codes" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление промокодами">
              💸 Промокоды
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/admin/categories" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление категориями">
              📁 Категории
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/admin/settings" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Настройки магазина">
              ⚙️ Настройки
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/admin/stats" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Просмотр статистики">
              📊 Статистика
            </Link>
          </motion.div>
        </nav>
        <motion.div variants={itemVariants}>
          <Link href="/" className="block text-gray-400 mt-6 text-xs hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Вернуться на главную страницу сайта">
            ← Вернуться на сайт
          </Link>
        </motion.div>
      </motion.aside>

      {/* Мобильное меню */}
      <div className="md:hidden">
        <motion.button
          onClick={toggleMobileMenu}
          className="p-4 text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isMobileMenuOpen ? (
            <Image src="/icons/times.svg" alt="Закрыть меню" width={24} height={24} />
          ) : (
            <Image src="/icons/bars.svg" alt="Открыть меню" width={24} height={24} />
          )}
        </motion.button>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 left-0 w-64 h-full bg-white border-r p-6 z-50"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold tracking-tight">Админ-панель</h2>
                <motion.button
                  onClick={toggleMobileMenu}
                  className="text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  aria-label="Закрыть меню"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Image src="/icons/times.svg" alt="Закрыть" width={20} height={20} />
                </motion.button>
              </div>
              <nav className="space-y-4 text-sm">
                <Link href="/admin" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Главная страница админ-панели" onClick={toggleMobileMenu}>
                  🏠 Главная
                </Link>
                <Link href="/admin/products" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление товарами" onClick={toggleMobileMenu}>
                  📦 Товары
                </Link>
                <Link href="/admin/orders" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление заказами" onClick={toggleMobileMenu}>
                  🧾 Заказы
                </Link>
                <Link href="/admin/customers" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление клиентами" onClick={toggleMobileMenu}>
                  👥 Клиенты
                </Link>
                <Link href="/admin/promo" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление промо-блоками" onClick={toggleMobileMenu}>
                  🏷️ Промо-блоки
                </Link>
                <Link href="/admin/promo-codes" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление промокодами" onClick={toggleMobileMenu}>
                  💸 Промокоды
                </Link>
                <Link href="/admin/categories" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Управление категориями" onClick={toggleMobileMenu}>
                  📁 Категории
                </Link>
                <Link href="/admin/settings" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Настройки магазина" onClick={toggleMobileMenu}>
                  ⚙️ Настройки
                </Link>
                <Link href="/admin/stats" className="block hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Просмотр статистики" onClick={toggleMobileMenu}>
                  📊 Статистика
                </Link>
              </nav>
              <form method="POST" action="/api/admin-logout" className="mt-6">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  aria-label="Выйти из админ-панели"
                >
                  Выйти
                </button>
              </form>
              <Link href="/" className="block text-gray-400 mt-6 text-xs hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black" aria-label="Вернуться на главную страницу сайта">
                ← Вернуться на сайт
              </Link>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <main className="flex-1 p-6 bg-white overflow-auto">{children}</main>
    </div>
  );
}