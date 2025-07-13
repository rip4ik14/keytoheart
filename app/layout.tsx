/* -------------------------------------------------------------------------- */
/*  Root Layout – глобальные стили, SEO-метаданные, JSON-LD граф              */
/*  Версия: 2025-07-13 — оптимизация ключевых слов, preconnect, sameAs, CSP   */
/* -------------------------------------------------------------------------- */

import './styles/globals.css';
import 'react-image-gallery/styles/css/image-gallery.css';

import localFont from 'next/font/local';
import { Metadata, Viewport } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { BreadcrumbList, LocalBusiness, Organization, WebSite } from 'schema-dts';

import LayoutClient from '@components/LayoutClient';
import { Category } from '@/types/category';
import { YM_ID } from '@/utils/ym';

/* ------------------------------------------------------------------ */
/*                                ШРИФТЫ                              */
/* ------------------------------------------------------------------ */
const golosText = localFont({
  variable: '--font-golos',
  display: 'swap',
  preload: true,
  src: [
    { path: '../public/fonts/golos-text_regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/golos-text_medium.woff2',  weight: '500', style: 'normal' },
    { path: '../public/fonts/golos-text_demibold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/golos-text_bold.woff2',     weight: '700', style: 'normal' }, // ⬅️ самый тяжёлый вес, preloaded
    { path: '../public/fonts/golos-text_black.woff2',    weight: '900', style: 'normal' },
  ],
});

const marqueeFont = localFont({
  variable: '--font-marquee',
  display: 'swap',
  preload: false, // heavy display font загружается лениво
  src: [{ path: '../public/fonts/MontserratMarquee.woff2', weight: '900', style: 'normal' }],
});

/* ------------------------------------------------------------------ */
/*                          БАЗОВЫЕ МЕТАДАННЫЕ                        */
/* ------------------------------------------------------------------ */
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL('https://keytoheart.ru'),
  title: {
    default: 'KEY TO HEART – клубничные букеты и цветы в Краснодаре',
    template: '%s | KEY TO HEART',
  },
  description:
    'Клубничные букеты и цветы с доставкой по Краснодару за 60 минут. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой.',
  /* 🎯 trimmed to ≤ 10 keywords */
  keywords: [
    'клубничные букеты Краснодар',
    'букет из клубники купить',
    'доставка цветов Краснодар',
    'букет на день рождения',
    'букеты 60 минут',
  ],
  alternates: {
    canonical: 'https://keytoheart.ru',
    languages: { ru: 'https://keytoheart.ru' },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KEY TO HEART',
    url: 'https://keytoheart.ru',
    title: 'KEY TO HEART – клубничные букеты и цветы в Краснодаре',
    description:
      'Клубничные букеты и цветы с доставкой по Краснодару за 60 минут. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой.',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничные букеты KEY TO HEART',
        type: 'image/webp',
      },
      {
        url: 'https://keytoheart.ru/og-bouquet.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничный букет с доставкой',
        type: 'image/webp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KEY TO HEART – клубничные букеты и цветы в Краснодаре',
    description:
      'Клубничные букеты и цветы с доставкой по Краснодару за 60 минут. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой.',
    images: [
      'https://keytoheart.ru/og-cover.webp',
      'https://keytoheart.ru/og-bouquet.webp',
    ],
  },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
  robots: { index: true, follow: true, noarchive: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/* ------------------------------------------------------------------ */
/*                                LAYOUT                              */
/* ------------------------------------------------------------------ */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /* ----------------- Подтягиваем категории из Supabase ----------------- */
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let categories: Category[] = [];
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=id,name,slug,is_visible,subcategories!subcategories_category_id_fkey(id,name,slug,is_visible)&is_visible=eq.true&order=id.asc`,
      { headers: { apikey: supabaseKey }, next: { revalidate: 3600 } },
    );
    const data = await res.json();
    if (Array.isArray(data)) {
      categories = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        is_visible: c.is_visible ?? true,
        subcategories:
          c.subcategories
            ?.filter((s: any) => s.is_visible)
            .map((s: any) => ({
              id: s.id,
              name: s.name,
              slug: s.slug,
              is_visible: s.is_visible ?? true,
            })) ?? [],
      }));
    }
  } catch (e) {
    process.env.NODE_ENV !== 'production' &&
      console.warn('[layout] categories fetch error →', e);
    categories = []; // graceful-fallback
  }

  /* ----------------------------- HTML шаблон ---------------------------- */
  return (
    <html lang="ru" className={`${golosText.variable} ${marqueeFont.variable}`}>
      <head>
        {/* базовые метатеги */}
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta httpEquiv="Content-Language" content="ru" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="yandex-verification" content="2d95e0ee66415497" />

        {/* Геотеги */}
        <meta name="geo.region" content="RU-KDA" />
        <meta name="geo.placename" content="Краснодар" />
        <meta name="geo.position" content="45.058090;39.037611" />
        <meta name="robots" content="index,follow" />

        {/* canonical + hreflang */}
        <link rel="canonical" href="https://keytoheart.ru/" />
        <link rel="alternate" href="https://keytoheart.ru/" hrefLang="ru" />

        {/* Preconnect / DNS-prefetch */}
        <link
          rel="preconnect"
          href="https://gwbeabfkknhewwoesqax.supabase.co"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />{/* ⬅️ добавлено */}
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* PWA / favicon extras */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="apple-mobile-web-app-title" content="KEY TO HEART" />
        <meta name="msapplication-TileColor" content="#ffffff" />

        {/* ---------------- JSON-LD: WebSite + Org + LocalBusiness ---------- */}
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: 'KEY TO HEART',
                url: 'https://keytoheart.ru',
                description:
                  'Клубничные букеты, цветы и подарки с доставкой в Краснодаре и до 20 км — от 60 минут, с 8:00 до 22:00.',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://keytoheart.ru/search?q={search_term_string}',
                  },
                  'query-input': 'required name=search_term_string',
                } as any,
              } satisfies WebSite,
              {
                '@type': 'Organization',
                name: 'KEY TO HEART',
                url: 'https://keytoheart.ru',
                logo: 'https://keytoheart.ru/logo.svg',
                sameAs: [
                  'https://www.instagram.com/keytoheart.ru/',
                  'https://t.me/keytoheart',
                  'https://wa.me/79886033821',
                  'https://maps.app.goo.gl/your-google-business-profile', // ⬅️ новый sameAs
                ],
              } satisfies Organization,
              {
                '@type': 'LocalBusiness',
                name: 'KEY TO HEART',
                url: 'https://keytoheart.ru',
                telephone: '+7-988-603-38-21',
                email: 'info@keytoheart.ru',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'ул. Героев-Разведчиков, 17/1',
                  addressLocality: 'Краснодар',
                  addressRegion: 'Краснодарский край',
                  postalCode: '350028',
                  addressCountry: 'RU',
                },
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: '45.058090',
                  longitude: '39.037611',
                },
                openingHours: ['Mo-Su 08:00-22:00'],
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
              } satisfies LocalBusiness,
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Главная',
                    item: 'https://keytoheart.ru',
                  },
                ],
              } satisfies BreadcrumbList,
            ],
          }}
        />

        {/* --------------------------- Яндекс.Метрика ----------------------- */}
        {YM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0];
              k.async=1;k.src=r;a.parentNode.insertBefore(k,a);})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym(${YM_ID}, "init", {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                trackHash:true,
                webvisor:true
              });`,
            }}
          />
        )}
      </head>

      {/* ----------------------- КЛИЕНТСКАЯ ЧАСТЬ ----------------------- */}
      <LayoutClient categories={categories}>{children}</LayoutClient>
    </html>
  );
}
