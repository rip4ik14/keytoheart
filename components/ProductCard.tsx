"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@context/CartContext";
import { useState, useEffect } from "react";

interface Product {
  id: number;
  title: string;
  price: number;
  images?: string[];
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const imageUrl = product.images?.[0] || "/placeholder.jpg";
  const bonus = Math.floor(product.price * 0.025);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showButton = hovered || isMobile;

  return (
    <div
      className="relative flex flex-col items-center group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300">
        {/* Стикер бонуса */}
        {bonus > 0 && (
          <div className="absolute top-2 left-2 bg-white text-xs font-semibold px-2 py-1 rounded-full shadow z-10">
            +{bonus} ₽
          </div>
        )}

        <Link href={`/product/${product.id}`}>
          <div className="relative w-full h-64 bg-gray-100">
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>

        <div className="p-4 text-center">
          <h3 className="text-base font-semibold text-gray-800 truncate">{product.title}</h3>
          <p className="text-[var(--orange)] font-bold mt-1">{product.price} ₽</p>
        </div>
      </div>

      {/* Кнопка с анимацией */}
      <div
        className={`transition-all duration-300 ${
          showButton
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          onClick={() =>
            addItem({
              id: product.id,
              title: product.title,
              price: product.price,
              quantity: 1,
              imageUrl,
            })
          }
          className="mt-2 bg-[#2d2d2d] text-white text-sm px-6 py-2 rounded-md shadow hover:bg-black transition"
        >
          В КОРЗИНУ
        </button>
      </div>
    </div>
  );
}
