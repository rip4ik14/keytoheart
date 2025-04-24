import "./styles/globals.css";
import "react-image-gallery/styles/css/image-gallery.css";
import TopBar from "@components/TopBar";
import StickyHeader from "@components/StickyHeader";
import Footer from "@components/Footer";
import { CartProvider } from "./context/CartContext";
import SupabaseProvider from "./providers/SupabaseProvider";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://keytoheart.ru"),
  title: {
    default: "KeyToHeart — букеты и подарки в Краснодаре",
    template: "%s | KeyToHeart",
  },
  description:
    "Свежие цветы, клубничные букеты и подарочные боксы с доставкой по Краснодару от 60 минут.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "KeyToHeart",
    url: "https://keytoheart.ru",
    images: "/og-cover.jpg",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  other: {
    "yandex-verification": "YOUR_YANDEX_CODE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Получаем текущую сессию пользователя на сервере
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white">
        {/* Supabase Auth Provider */}
        <SupabaseProvider initialSession={session}>
          {/* Глобальный контекст корзины */}
          <CartProvider>
            <TopBar />
            <StickyHeader />
            <main>{children}</main>
            <Footer />
          </CartProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
