"use client";

import Link from "next/link";
import { useCart } from "@context/CartContext";
import BurgerMenu from "@components/BurgerMenu";
import { useState, useEffect } from "react";

export default function Header() {
  const { items } = useCart();
  const [cartSum, setCartSum] = useState(0);

  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setCartSum(sum);
  }, [items]);

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <BurgerMenu />
          <div>Краснодар</div>
          <div>Режим работы: 8:00 - 22:00</div>
          <div className="flex items-center gap-2">
            <a href="tel:+79886033821" className="hover:text-orange-500">
              +7 (988) 603-38-21
            </a>
            <a
              href="https://wa.me/79886033821"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-600"
              title="Написать в WhatsApp"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 448 512"
                className="w-4 h-4"
              >
                <path d="M380.9 97.1C339 55.2 283.5 32 224 32 103.5 32 0 135.5 0 256c0 45.3 11.8 89.7 34.2 128L0 480l98.7-33.6c36.6 19.7 77.5 30 119.3 30 120.6 0 224-97.4 224-224 0-59.5-23.1-115-61.1-154.9zM224 426c-38.4 0-76-10.5-108.5-30.4l-7.7-4.6-65.2 22 21.8-63.3-5-8c-20.6-32.9-31.5-71-31.5-109.3 0-110.1 89.9-200 200-200 53.3 0 103.4 20.8 103.4 20.8 37.7 37.7 58.5 87.8 58.5 141.1 0 110.1-89.9 200-200 200zm109.9-150.7c-6-3-35.4-17.4-40.8-19.4-5.4-2-9.4-3-13.4 3-4 6-15.4 19.4-19 23.4-3.4 4-7 4.5-13 1.5-6.4-3-27-10-51.5-32.3-19-17-31.9-38-35.6-44.4-3.6-6.4-.4-9.8 2.6-13 2.7-2.7 6-7 9-10.4 3-3.4 4-5.9 6-9.9 2-4 1-7.4-.5-10.4-1.5-3-13.4-32.4-18.4-44.4-4.8-11.5-9.7-9.9-13.4-10.1-3.4-.2-7.4-.2-11.4-.2-4 0-10.4 1.5-15.8 7.4-5.4 6-20.4 20-20.4 48.8 0 28.8 20.9 56.8 23.8 60.8 3 4 41.2 62.8 100 88.1 59.2 25.7 59.2 17 70 16 10.7-1 34.2-13.8 39-27.2 4.8-13.4 4.8-24.8 3.4-27.3-1.4-2.6-5.4-4-11.4-7z" />
              </svg>
            </a>
            <a
              href="https://t.me/username"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
              title="Написать в Telegram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 496 512"
                className="w-4 h-4"
              >
                <path d="M248 8C111 8 0 119.033 0 256s111 248 248 248 248-111.033 248-248S385 8 248 8zm114.9 161.7-36.4 172.2c-2.7 12.1-9.8 15.1-19.9 9.4l-55-40.7-26.5 25.5c-2.9 2.9-5.3 5.3-10.8 5.3l3.8-53.9 98.2-88c4.3-3.8-1-5.9-6.6-2.1l-121 76.2-52.1-16.3c-11.3-3.5-11.5-11.3 2.4-16.7l203.5-78.4c9.3-3.3 17.4 2.2 14.4 16.2z" />
              </svg>
            </a>
          </div>
        </div>

        <Link href="/" className="text-xl font-bold text-gray-900">
          KeyToHeart
        </Link>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded">
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M21 21l-4.35-4.35m0 0a7.5 7.5 0 1110.6-10.6 7.5 7.5 0 01-10.6 10.6z" />
            </svg>
          </button>
          <Link
            href="/account"
            className="p-2 hover:bg-gray-100 rounded text-sm text-gray-700"
          >
            Вход
          </Link>
          <Link
            href="/cart"
            className="relative p-2 hover:bg-gray-100 rounded flex items-center gap-1"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M3 3h2l.4 2M7 13h10l3.6-7H5.4"></path>
              <circle cx="7" cy="19" r="2"></circle>
              <circle cx="17" cy="19" r="2"></circle>
            </svg>
            {cartSum > 0 && (
              <span className="text-sm text-orange-500 font-semibold">
                {cartSum} ₽
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}