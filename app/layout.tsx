// app/layout.tsx
import './styles/globals.css';
import 'react-image-gallery/styles/css/image-gallery.css';
import localFont from 'next/font/local';

const golosText = localFont({
  variable: '--font-golos',
  src: [
    { path: '../public/fonts/golos-text_regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/golos-text_medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/golos-text_demibold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/golos-text_bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/golos-text_black.woff2', weight: '900', style: 'normal' },
  ],
  display: 'swap',
});

const marqueeFont = localFont({
  variable: '--font-marquee',
  src: '../public/fonts/MontserratMarquee.woff2',
  display: 'swap',
});

import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { JsonLd } from 'react-schemaorg';
import type { BreadcrumbList, LocalBusiness, WebSite } from 'schema-dts';
import { Suspense } from 'react';

import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import Footer from '@components/Footer';
import CookieBanner from '@components/CookieBanner';
import ClientBreadcrumbs from '@components/ClientBreadcrumbs';
import PromoFooterBlock from '@components/PromoFooterBlock';
import MobileContactFab from '@components/MobileContactFab';

import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';

import { Category } from '@/types/category';

export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL('https://keytoheart.ru'),
  title: {
    default: 'Клубничные букеты, цветы и подарки с доставкой в Краснодаре | KeyToHeart',
    template: '%s | KeyToHeart',
  },
  description:
    'Закажите клубничные букеты, свежие цветы и подарочные боксы с доставкой по Краснодару. KeyToHeart — идеальные подарки на 8 марта, Новый год, День Победы и любой праздник! Доставка 24/7.',
  keywords: [
    'клубничные букеты Краснодар',
    'доставка цветов Краснодар',
    'подарки Краснодар',
    'цветы Краснодар',
    'подарочные боксы Краснодар',
    'подарки на 8 марта Краснодар',
    'подарки на Новый год Краснодар',
    'цветы на День Победы Краснодар',
    'цветы на выпускной Краснодар',
    'подарки на свадьбу Краснодар',
    'цветы на 14 февраля Краснодар',
    'доставка цветов недорого Краснодар',
    'доставка цветов 24/7 Краснодар',
    'заказать цветы Краснодар',
    'клубничные букеты недорого Краснодар',
    'подарки на день рождения Краснодар',
    'подарки на юбилей Краснодар',
    'подарки для девушки Краснодар',
    'подарки для мужчины Краснодар',
    'романтические подарки Краснодар',
    'цветы на День учителя Краснодар',
    'цветы на День матери Краснодар',
    'подарки на 23 февраля Краснодар',
    'эксклюзивные подарки Краснодар',
    'подарки на годовщину Краснодар',
    'доставка цветов на дом Краснодар',
    'цветы оптом Краснодар',
    'KeyToHeart',
  ],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KeyToHeart',
    url: 'https://keytoheart.ru',
    title: 'Клубничные букеты, цветы и подарки с доставкой в Краснодаре | KeyToHeart',
    description:
      'Закажите клубничные букеты, свежие цветы и подарочные боксы с доставкой по Краснодару. KeyToHeart — идеальные подарки на 8 марта, Новый год, День Победы, день рождения, юбилей и любой праздник! Доставка 24/7.',
    images: [
      {
        url: '/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'KeyToHeart — клубничные букеты и подарки в Краснодаре',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Клубничные букеты, цветы и подарки с доставкой в Краснодаре | KeyToHeart',
    description:
      'Закажите клубничные букеты, свежие цветы и подарочные боксы с доставкой по Краснодару. KeyToHeart — идеальные подарки на 8 марта, Новый год, День Победы, день рождения, юбилей и любой праздник! Доставка 24/7.',
    images: ['/og-cover.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch categories once per revalidate period
  let categories: Category[] = [];
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/categories?select=id,name,slug,is_visible,subcategories!subcategories_category_id_fkey(id,name,slug,is_visible)&is_visible=eq.true&order=id.asc`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        next: { revalidate: 3600 },
      }
    );
    const data = await res.json();
    if (Array.isArray(data)) {
      categories = data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        is_visible: cat.is_visible ?? true,
        subcategories:
          cat.subcategories
            ?.filter((s: any) => s.is_visible)
            .map((s: any) => ({
              id: s.id,
              name: s.name,
              slug: s.slug,
              is_visible: s.is_visible ?? true,
            })) ?? [],
      }));
    }
  } catch (err) {
    process.env.NODE_ENV !== "production" && console.error('RootLayout: could not load categories', err);
  }

  const ymId = process.env.NEXT_PUBLIC_YM_ID;

  return (
    <html lang="ru" className={`${golosText.variable} ${marqueeFont.variable}`}>
      <head>
        <meta name="yandex-verification" content="2d95e0ee66415497" />
        <meta name="geo.region" content="RU-KDA" />
        <meta name="geo.placename" content="Краснодар" />
        <meta name="geo.position" content="45.035470;38.975313" />
        <link rel="preload" href="/og-cover.jpg" as="image" />
        {/* === Preconnect для ускорения загрузки Supabase CDN === */}
        <link
          rel="preconnect"
          href="https://gwbeabfkknhewwoesqax.supabase.co"
          crossOrigin=""
        />

        {/* SEO разметка */}
        <JsonLd<WebSite>
          item={{
            '@type': 'WebSite',
            name: 'KeyToHeart',
            url: 'https://keytoheart.ru',
            description:
              'Клубничные букеты, свежие цветы и подарочные боксы с доставкой по Краснодару. Подарки на 8 марта, Новый год, День Победы и любой праздник!',
          }}
        />
        <JsonLd<LocalBusiness>
          item={{
            '@type': 'LocalBusiness',
            name: 'KeyToHeart',
            url: 'https://keytoheart.ru',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Краснодар',
              addressRegion: 'Краснодарский край',
              addressCountry: 'RU',
            },
            telephone: '+7-988-603-38-21',
            email: 'info@keytoheart.ru',
            openingHoursSpecification: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
              ],
              opens: '08:00',
              closes: '22:00',
            },
          }}
        />
        <JsonLd<BreadcrumbList>
          item={{
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Главная',
                item: 'https://keytoheart.ru',
              },
            ],
          }}
        />

        {/* Яндекс Метрика */}
        {ymId && (
          <Script id="yandex-metrika" strategy="lazyOnload">
            {`
              (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){
                  (m[i].a=m[i].a||[]).push(arguments)
                };
                m[i].l=1*new Date();
                k=e.createElement(t);
                a=e.getElementsByTagName(t)[0];
                k.async=1;
                k.src=r;
                a.parentNode.insertBefore(k,a)
              })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym('${ymId}', "init", {
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                trackHash: true,
                webvisor: true,
                ecommerce: "dataLayer",
                triggerEvent: true
              });
            `}
          </Script>
        )}

        {/* Яндекс Турбо */}
        {ymId && (
          <Script id="yandex-turbo" strategy="lazyOnload">
            {`
              (function() {
                var turboScript = document.createElement('script');
                turboScript.src = 'https://cdn.turbo.yandex.ru/turbo.js';
                turboScript.async = true;
                document.head.appendChild(turboScript);
              })();
            `}
          </Script>
        )}
      </head>

      <body className="font-sans">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only absolute left-2 top-2 z-50 bg-white text-black p-2"
        >
          Перейти к основному содержимому
        </a>
        <CartAnimationProvider>
          <CartProvider>
            {/* Top Navigation */}
            <TopBar />
            <StickyHeader initialCategories={categories} />

            {/* Breadcrumbs */}
            <Suspense fallback={<div>Загрузка...</div>}>
              <ClientBreadcrumbs />
            </Suspense>

            {/* Main Content */}
            <main id="main-content" className="pt-12 sm:pt-14">{children}</main>

            {/* Promo block right above footer */}
            <PromoFooterBlock />

            {/* Standard Footer */}
            <Footer categories={categories} />

            {/* Cookie banner */}
            <CookieBanner />

            {/* Mobile “Contact Us” FAB */}
            <MobileContactFab />

            {/* Hidden SEO text */}
            <div className="sr-only" aria-hidden="true">
              <p>
                Клубничные букеты Краснодар, доставка цветов Краснодар, подарки Краснодар, цветы Краснодар, подарочные боксы Краснодар, подарки на 8 марта Краснодар, подарки на Новый год Краснодар, цветы на День Победы Краснодар, цветы на выпускной Краснодар, подарки на свадьбу Краснодар, цветы на 14 февраля Краснодар, доставка цветов недорого Краснодар, доставка цветов 24/7 Краснодар, заказать цветы Краснодар, клубничные букеты недорого Краснодар, подарки на день рождения Краснодар, подарки на юбилей Краснодар, подарки для девушки Краснодар, подарки для мужчины Краснодар
              </p>
            </div>
          </CartProvider>
        </CartAnimationProvider>
      </body>
    </html>
  );
}
