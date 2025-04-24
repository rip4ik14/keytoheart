"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FaVk,
  FaTelegramPlane,
  FaWhatsapp,
  FaTimes,
} from "react-icons/fa";

export default function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navLinks = [
    { name: "Каталог", href: "/#catalog" },
    { name: "О нас", href: "/about" },
    { name: "Доставка", href: "/delivery" },
    { name: "Помощь", href: "/help" },
    { name: "Программа лояльности", href: "/loyalty" },
    { name: "Корпоративным клиентам", href: "/corporate" },
    { name: "Новости", href: "/news" },
    { name: "Праздники", href: "/prazdniki" },
    { name: "Контакты", href: "/contacts" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 50) setIsOpen(false);
    };

    const menu = menuRef.current;
    if (menu) {
      menu.addEventListener("touchstart", handleTouchStart);
      menu.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (menu) {
        menu.removeEventListener("touchstart", handleTouchStart);
        menu.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-100 rounded"
        aria-label="Открыть меню"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        className={`fixed top-0 left-0 h-full w-72 max-w-full bg-white z-[1000] shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        ref={menuRef}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <span className="text-sm font-semibold">Меню</span>
          <button onClick={() => setIsOpen(false)} aria-label="Закрыть меню">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navLinks.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block py-2 text-gray-800 hover:text-orange-500 transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-6 flex gap-4 text-lg text-gray-600 justify-start">
          <a href="https://vk.com/keytoheart" target="_blank" rel="noopener noreferrer" title="ВКонтакте">
            <FaVk />
          </a>
          <a href="https://t.me/keytomyheart" target="_blank" rel="noopener noreferrer" title="Telegram">
            <FaTelegramPlane className="text-blue-500" />
          </a>
          <a href="https://wa.me/79886033821" target="_blank" rel="noopener noreferrer" title="WhatsApp">
            <FaWhatsapp className="text-green-600" />
          </a>
        </div>
      </div>

      {/* Затенение фона */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[999]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
