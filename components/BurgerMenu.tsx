'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navLinks = [
    { name: 'Каталог', href: '/#catalog' },
    { name: 'О нас', href: '/about' },
    { name: 'Доставка', href: '/dostavka' },
    { name: 'Часто задаваемые вопросы', href: '/faq' },
    { name: 'Оплата', href: '/payment' },
    { name: 'Программа лояльности', href: '/loyalty' },
    { name: 'Корпоративным клиентам', href: '/corporate' },
    { name: 'Новости', href: '/news' },
    { name: 'Статьи', href: '/articles' },
    { name: 'Праздники', href: '/occasions' },
    { name: 'Контакты', href: '/contacts' },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let startX = 0;
    const menu = menuRef.current;

    const onTouchStart = (e: TouchEvent) => (startX = e.touches[0].clientX);
    const onTouchEnd = (e: TouchEvent) => {
      if (startX - e.changedTouches[0].clientX > 50) {
        setIsOpen(false);
      }
    };

    if (menu) {
      menu.addEventListener('touchstart', onTouchStart);
      menu.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      if (menu) {
        menu.removeEventListener('touchstart', onTouchStart);
        menu.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, []);

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          window.gtag?.('event', 'open_burger_menu', { event_category: 'navigation' });
          window.ym?.(96644553, 'reachGoal', 'open_burger_menu');
        }}
        className="p-2 hover:bg-gray-100 rounded"
        aria-label="Открыть меню навигации"
      >
        <svg
          className="w-6 h-6 text-black"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        ref={menuRef}
        className={`
          fixed top-0 left-0 z-[1000] h-full w-72 bg-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="dialog"
        aria-label="Меню навигации"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-sm font-semibold">Меню</span>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Закрыть меню навигации"
          >
            <Image src="/icons/times.svg" alt="Close" width={20} height={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1" aria-label="Основная навигация">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={() => {
                setIsOpen(false);
                window.gtag?.('event', 'burger_menu_link', {
                  event_category: 'navigation',
                  link: link.name,
                });
                window.ym?.(96644553, 'reachGoal', 'burger_menu_link', {
                  link: link.name,
                });
              }}
              className="block py-2 text-black hover:bg-gray-100 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4 flex gap-4 text-xl text-black">
          <a
            href="https://vk.com/key_to_heart_store"
            target="_blank"
            rel="noopener noreferrer"
            title="ВКонтакте"
            aria-label="Перейти в ВКонтакте"
          >
            <Image src="/icons/vk.svg" alt="VK" width={24} height={24} />
          </a>
          <a
            href="https://t.me/keytomyheart"
            target="_blank"
            rel="noopener noreferrer"
            title="Telegram"
            aria-label="Перейти в Telegram"
          >
            <Image src="/icons/telegram.svg" alt="Telegram" width={24} height={24} />
          </a>
          <a
            href="https://wa.me/79886033821"
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            aria-label="Перейти в WhatsApp"
          >
            <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={24} height={24} />
          </a>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[999]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}