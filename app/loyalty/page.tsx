// ✅ Путь: /app/loyalty/page.tsx     ←  без "use client"
import LoyaltyPageClient from "./LoyaltyPageClient";
import type { Metadata } from "next";

/* --- SEO‑мета --- */
export const metadata: Metadata = {
  title: "Программа лояльности • до 15 % бонусами",
  description:
    "Получайте кешбэк до 15 % за каждый заказ на KeyToHeart и оплачивайте им до 15 % следующих покупок.",
  openGraph: { images: "/og-cover.jpg" },
};

export default function LoyaltyPage() {
  /* просто рендерим клиентский компонент */
  return <LoyaltyPageClient />;
}
