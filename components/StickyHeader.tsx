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
import { useEffect, useState, useRef } from "react";

export default function StickyHeader() {
  const { items } = useCart();
  const [cartSum, setCartSum] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setCartSum(sum);
  }, [items]);

  useEffect(() => {
    const userPhone = localStorage.getItem("userPhone");
    setIsLoggedIn(!!userPhone);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userPhone");
    localStorage.removeItem("bonusData");
    localStorage.removeItem("ordersData");
    setIsLoggedIn(false);
    location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between flex-wrap gap-2 sm:gap-0">
        <div className="flex items-center gap-4 text-sm text-gray-700 flex-wrap">
          <BurgerMenu />
          <span className="hidden sm:inline">Краснодар</span>
          <div className="flex flex-col leading-tight">
            <a href="tel:+79886033821" className="font-medium hover:underline">
              +7 (988) 603-38-21
            </a>
            <span className="text-xs text-gray-400">с 08:00 до 22:00</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://wa.me/79886033821" target="_blank" rel="noopener noreferrer" className="border rounded-full p-2 hover:bg-green-50 transition" title="WhatsApp">
              <FaWhatsapp className="text-green-600 w-4 h-4" />
            </a>
            <a href="https://t.me/keytomyheart" target="_blank" rel="noopener noreferrer" className="border rounded-full p-2 hover:bg-blue-50 transition" title="Telegram">
              <FaTelegramPlane className="text-blue-500 w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="flex-1 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-gray-800">
            KeyToHeart
          </Link>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700 relative">
          <button className="p-2 hover:bg-gray-100 rounded-full" title="Поиск">
            <FaSearch className="w-4 h-4" />
          </button>

          {isLoggedIn ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="px-4 py-1 border rounded-full hover:bg-gray-50"
              >
                Кабинет
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50">
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    История заказов
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/account"
              className="px-4 py-1 border rounded-full hover:bg-gray-50"
            >
              Вход
            </Link>
          )}

          <Link
            href="/cart"
            className="flex items-center gap-1 border px-3 py-1 rounded-full hover:bg-gray-50"
          >
            <FaShoppingCart className="w-4 h-4" />
            {cartSum > 0 && <span>{cartSum} ₽</span>}
          </Link>
        </div>
      </div>

      <div className="bg-white border-t border-gray-100">
        <CategoryNav />
      </div>
    </header>
  );
}
