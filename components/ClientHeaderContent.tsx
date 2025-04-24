"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { useCart } from "@context/CartContext";
import BurgerMenu from "@components/BurgerMenu";


export default function ClientHeaderContent() {
  const { items } = useCart();
  const [cartSum, setCartSum] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  useEffect(() => {
    const sum = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    setCartSum(sum);
  }, [items]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, subcategories (id, name, slug)");
      if (!error && data) setCategories(data);
    };
    fetchCategories();
  }, []);

  return (
    <>
      {/* Анимированная лента */}
      <div className="w-full bg-black text-white overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-1 text-center text-sm">
          🎁 Бесплатная открытка к каждому заказу &nbsp;&nbsp;&nbsp; 🚚 Доставка
          день в день по Краснодару &nbsp;&nbsp;&nbsp; 🎉 Подарки постоянным
          клиентам!
        </div>
      </div>

      {/* Основной хедер */}
      <header className="bg-white border-b shadow-sm z-50 relative">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center text-sm text-gray-700">
          {/* Левая часть */}
          <div className="flex items-center gap-4">
            <BurgerMenu />
            <div className="hidden sm:block">Краснодар</div>
            <a href="tel:+79886033821" className="hover:text-orange-500">
              +7 (988) 603-38-21
            </a>
          </div>

          {/* Центр — логотип и меню */}
          <div className="relative flex items-center gap-6">
            <Link
              href="/"
              className="text-lg sm:text-xl font-bold text-gray-900"
            >
              KeyToHeart
            </Link>

            <nav className="hidden lg:flex gap-4 relative">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className="hover:text-orange-500 px-2 py-1 block"
                  >
                    {cat.name}
                  </Link>
                  {hoveredCategory === cat.id && cat.subcategories?.length > 0 && (
                    <div className="absolute left-0 top-full bg-white shadow-md rounded mt-1 min-w-[200px] z-40">
                      {cat.subcategories.map((sub: any) => (
                        <Link
                          key={sub.id}
                          href={`/category/${cat.slug}/${sub.slug}`}
                          className="block px-4 py-2 hover:bg-gray-100 text-sm text-gray-800"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded" title="Поиск">
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
              href="/cart"
              className="relative p-2 hover:bg-gray-100 rounded flex items-center gap-1"
              title="Корзина"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M3 3h2l.4 2M7 13h10l3.6-7H5.4" />
                <circle cx="7" cy="19" r="2" />
                <circle cx="17" cy="19" r="2" />
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
    </>
  );
}
