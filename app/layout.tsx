import './styles/globals.css';
import 'react-image-gallery/styles/css/image-gallery.css';

import localFont from 'next/font/local';
import { Metadata, Viewport } from 'next';
import LayoutClient from '@components/LayoutClient';


/* ------------------------------------------------------------------ */
/*                          ШРИФТЫ (next/font)                        */
/* ------------------------------------------------------------------ */
const golosText = localFont({
  variable: '--font-golos',
  display: 'swap',
  preload: true,
  src: [
    { path: '../public/fonts/golos-text_regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/golos-text_medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/golos-text_demibold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/golos-text_bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/golos-text_black.woff2', weight: '900', style: 'normal' },
  ],
});

const marqueeFont = localFont({
  variable: '--font-marquee',
  display: 'swap',
  preload: false,
  src: [{ path: '../public/fonts/MontserratMarquee.woff2', weight: '900', style: 'normal' }],
});

/* ------------------------------------------------------------------ */
/*                       БАЗОВЫЕ SEO-МЕТАДАННЫЕ                      */
/* ------------------------------------------------------------------ */
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL('https://keytoheart.ru'),
  title: {
    default: 'Клубничные букеты в Краснодаре | Доставка KEY TO HEART',
    template: '%s | Клубничные букеты и цветы в Краснодаре | KEY TO HEART',
  },
  description:
    'Закажите клубничные букеты и цветы с доставкой в Краснодаре и до 20 км вокруг за 60 минут. Свежие ягоды, бельгийский шоколад, фото перед отправкой. Работаем с 8:00 до 22:00.',
  keywords: [
    'доставка клубничных букетов Краснодар', 'купить букет из клубники Краснодар', 'букет из клубники с шоколадом Краснодар',
    'доставка цветов Краснодар', 'купить цветы Краснодар', 'букет цветов Краснодар', 'заказать букет Краснодар',
    'доставка клубничных букетов на день рождения Краснодар', 'купить букет из клубники с доставкой',
    'доставка цветов в Прикубанский округ', 'цветы с доставкой до 20 км от Краснодара'
  ],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KEY TO HEART',
    url: 'https://keytoheart.ru',
    title: 'Клубничные букеты и цветы с доставкой в Краснодаре и до 20 км',
    description:
      'Закажите клубничные букеты и цветы с доставкой в Краснодаре и до 20 км вокруг за 60 минут. Свежие ягоды, бельгийский шоколад, фото перед отправкой. Работаем с 8:00 до 22:00.',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничные букеты и цветы KEY TO HEART в Краснодаре',
        type: 'image/webp',
      },
      {
        url: 'https://keytoheart.ru/og-bouquet.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничный букет с доставкой в Краснодаре',
        type: 'image/webp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Клубничные букеты и цветы с доставкой в Краснодаре и до 20 км',
    description:
      'Закажите клубничные букеты и цветы с доставкой в Краснодаре и до 20 км вокруг за 60 минут. Свежие ягоды, бельгийский шоколад, фото перед отправкой. Работаем с 8:00 до 22:00.',
    images: ['https://keytoheart.ru/og-cover.webp', 'https://keytoheart.ru/og-bouquet.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
  robots: {
    index: true,
    follow: true,
    noarchive: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/* ------------------------------------------------------------------ */
/*                             LAYOUT                                 */
/* ------------------------------------------------------------------ */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="ru" className={`${golosText.variable} ${marqueeFont.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="yandex-verification" content="2d95e0ee66415497" />
        <meta name="geo.region" content="RU-KDA" />
        <meta name="geo.placename" content="Краснодар" />
        <meta name="geo.position" content="45.035470;38.975313" />
        <meta name="robots" content="index,follow" />
        <link
          rel="preconnect"
          href="https://gwbeabfkknhewwoesqax.supabase.co"
          crossOrigin="anonymous"
        />
      </head>

      <body className="font-sans">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}