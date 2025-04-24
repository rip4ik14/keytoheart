// ✅ Путь: components/CategoryBreadcrumbs.tsx
'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";

const titleMap: { [key: string]: string } = {
  "klubnichnye-bukety": "Клубничные букеты",
  "klubnichnye-boksy": "Клубничные боксы",
  flowers: "Цветы",
  combo: "Комбо-наборы",
  premium: "Premium",
  baskets: "Корзинки",
  povod: "Повод",
  podarki: "Подарки",
  collection: "Коллекции",
  cart: "Моя корзина",
  kollekcii: "Коллекции"

  
};

export default function CategoryBreadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  const links = [{ href: "/", label: "Главная" }];

  // Если это страница корзины
  if (parts[0] === "cart") {
    links.push({ href: "/cart", label: "Моя корзина" });
  }

  // Если это страница категории
  if (parts[0] === "category" && parts[1]) {
    links.push({
      href: `/category/${parts[1]}`,
      label: titleMap[parts[1]] || decodeURIComponent(parts[1]),
    });
  }

  // Последняя часть (например, товар)
  const lastPart = parts[2];
  const lastLabel = lastPart ? decodeURIComponent(lastPart) : "";

  return (
    <div className="relative z-10 bg-gray-50 border-b border-gray-200 px-4 sm:px-8 py-4">
      <div className="max-w-screen-xl mx-auto">
        <nav className="text-sm text-gray-600 mb-2">
          <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
            {links.map((link, index) => (
              <li key={index} className="flex items-center gap-1">
                {index !== 0 && <span className="text-gray-400">/</span>}
                <Link href={link.href} className="hover:underline text-gray-500">
                  {link.label}
                </Link>
              </li>
            ))}
            {lastLabel && (
              <li className="flex items-center gap-1">
                <span className="text-gray-400">/</span>
                <span className="text-gray-800 font-medium">{lastLabel}</span>
              </li>
            )}
          </ol>
        </nav>

    
      </div>
    </div>
  );
}
