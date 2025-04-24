// app/components/StickyHeader.tsx
"use client";

import Link from "next/link";
import {
  FaUser,
  FaShoppingCart,
  FaSearch,
  FaWhatsapp,
  FaTelegramPlane,
} from "react-icons/fa";
import BurgerMenu from "@components/BurgerMenu";
import CategoryNav from "@components/CategoryNav";
import { useCart } from "@context/CartContext";
import { useEffect, useState } from "react";

export default function StickyHeader() {
  const { items } = useCart();
  const [cartSum, setCartSum] = useState(0);

  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setCartSum(sum);
  }, [items]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Верхняя панель */}
      <div className="container mx-auto flex justify-between items-center py-3 px-4">
        {/* Левая часть */}
        <div className="flex items-center gap-4">
          <BurgerMenu />
          <span className="text-sm text-gray-500">Краснодар</span>
          <span className="text-sm text-gray-500 hidden sm:inline">
            +7 (988) 693-39-21
          </span>
          <span className="text-xs text-gray-400 hidden sm:inline">
            Режим работы: с 08:00 до 22:00
          </span>
        </div>

        {/* Центр — ЛОГО */}
        <Link href="/" className="text-2xl font-bold tracking-tight text-gray-800">
          KeyToHeart
        </Link>

        {/* Правая часть */}
        <div className="flex items-center gap-3">
          <button className="icon-button">
            <FaSearch className="w-4 h-4" />
          </button>

          <Link href="/login" className="icon-button">
            <FaUser className="w-4 h-4" />
          </Link>

          <Link href="/cart" className="icon-button relative flex items-center gap-1 px-3 py-2">
            <FaShoppingCart className="w-4 h-4" />
            <span className="text-sm">{cartSum} ₽</span>
          </Link>

          <a
            href="https://wa.me/79886033821"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-button"
          >
            <FaWhatsapp className="w-4 h-4" />
          </a>
          <a
            href="https://t.me/username"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-button"
          >
            <FaTelegramPlane className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Навигация по категориям */}
      <div className="bg-white border-t border-gray-100">
        <CategoryNav />
      </div>
    </header>
  );
}
