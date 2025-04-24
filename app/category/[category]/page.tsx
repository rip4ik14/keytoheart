// Путь: /app/category/[category]/page.tsx

import CategoryPageClient from "./CategoryPageClient";
import { supabasePublic as supabase } from "@/lib/supabase/public";
import type { Metadata } from "next";
import React from "react";

/* slug → читаемое название */
const map: Record<string, string> = {
  flowers: "Цветы",
  "klubnichnye-bukety": "Клубничные букеты",
  "klubnichnye-boksy": "Клубничные боксы",
  combo: "Комбо‑наборы",
  premium: "Premium",
  kollekcii: "Коллекции",
  povod: "Повод",
  podarki: "Подарки",
};

/* ---------- динамический SEO ---------- */
export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const name = map[params.category] || "Категория";
  return {
    title: `${name} — купить с доставкой в Краснодаре`,
    description: `Свежие ${name.toLowerCase()} с доставкой по Краснодару. Закажите онлайн — привезём за 60 минут.`,
    openGraph: { images: ["/og-cover.jpg"] },
  };
}
/* -------------------------------------- */

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const apiName = map[params.category];
  if (!apiName) {
    return (
      <div className="p-10 text-center text-red-600">
        Категория не найдена
      </div>
    );
  }

  // Загружаем товары на сервере через публичный клиент Supabase
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", apiName)
    .eq("in_stock", true)
    .order("id", { ascending: false });

  if (error) {
    console.error("Ошибка загрузки товаров:", error.message);
    return (
      <div className="p-10 text-center text-red-600">
        Ошибка загрузки товаров
      </div>
    );
  }

  return (
    <CategoryPageClient
      products={products || []}
      apiName={apiName}
      slug={params.category}
    />
  );
}
