/* -------------------------------------------------------------------------- */
/*  Root Layout – глобальные стили, SEO-метаданные, JSON-LD граф              */
/* -------------------------------------------------------------------------- */

import './styles/globals.css';

import localFont from 'next/font/local';
import { Metadata, Viewport } from 'next';
import { JsonLd } from 'react-schemaorg';
import type {
  BreadcrumbList,
  LocalBusiness,
  Organization,
  WebSite,
} from 'schema-dts';

import LayoutClient from '@components/LayoutClient';
import { Category } from '@/types/category';
import { YM_ID } from '@/utils/ym'; // Яндекс.Метрика

/* --------------------------- шрифты через localFont ----------------------- */
const golosText = localFont({
  variable: '--font-golos',
  display: 'swap',
  preload: true,
  src: [
    { path: '../public/fonts/golos-text_regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/golos-text_medium.woff2',  weight: '500', style: 'normal' },
    { path: '../public/fonts/golos-text_demibold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/golos-text_bold.woff2',     weight: '700', style: 'normal' },
    { path: '../public/fonts/golos-text_black.woff2',    weight: '900', style: 'normal' },
  ],
});

const marqueeFont = localFont({
  variable: '--font-marquee',
  display: 'swap',
  preload: false,
  src: [{ path: '../public/fonts/MontserratMarquee.woff2', weight: '900', style: 'normal' }],
});

/* ------------------------------ ISR -------------------------------------- */
export const revalidate = 3600;

/* --------------------------- META-ДАННЫЕ ---------------------------------- */
export const metadata: Metadata = {
  metadataBase: new URL('https://keytoheart.ru'),
  title: {
    default: 'KEY TO HEART – клубника в шоколаде, букеты и цветы в Краснодаре',
    template: '%s | KEY TO HEART',
  },
  description:
    'Клубника в шоколаде, клубничные букеты и цветы с доставкой по Краснодару за 60 минут. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой.',
  alternates: {
    canonical: 'https://keytoheart.ru',
    languages: { ru: 'https://keytoheart.ru' },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KEY TO HEART',
    url: 'https://keytoheart.ru',
    title: 'KEY TO HEART – клубника в шоколаде, букеты и цветы в Краснодаре',
    description:
      'Клубника в шоколаде, клубничные букеты и цветы с доставкой по Краснодару за 60 минут. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой.',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубника в шоколаде – KEY TO HEART',
        type: 'image/webp',
      },
      {
        url: 'https://keytoheart.ru/og-square.webp',
        width: 800,
        height: 800,
        alt: 'Клубничный букет – KEY TO HEART',
        type: 'image/webp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KEY TO HEART – клубника в шоколаде и цветы в Краснодаре',
    description:
      'Клубника в шоколаде, букеты и цветы с доставкой по Краснодару за 60 минут. Фото перед отправкой, доставка 9-22.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
  robots: { index: true, follow: true },
};

/* --------------------------- viewport ------------------------------------- */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/* -------------------------------------------------------------------------- */
/*                                ROOT LAYOUT                                */
/* -------------------------------------------------------------------------- */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /* --- SSR-загрузка категорий из Supabase для меню — ошибки не валят страницу --- */
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
    categories = [];
  }

  return (
    <html lang="ru" className={`${golosText.variable} ${marqueeFont.variable}`}>
      <head>
        {/* preload основного шрифта для WebKit (Safari) */}
        <link
          rel="preload"
          href="/fonts/golos-text_regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* базовые метатеги */}
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta httpEquiv="Content-Language" content="ru" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="yandex-verification" content="2d95e0ee66415497" />

        {/* геотеги */}
        <meta name="geo.region" content="RU-KDA" />
        <meta name="geo.placename" content="Краснодар" />
        <meta name="geo.position" content="45.058090;39.037611" />

        {/* preconnect */}
        <link
          rel="preconnect"
          href="https://gwbeabfkknhewwoesqax.supabase.co"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* PWA / favicon extras */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="apple-mobile-web-app-title" content="KEY TO HEART" />
        <meta name="msapplication-TileColor" content="#ffffff" />

        {/* ---------- JSON-LD: WebSite + Org + LocalBusiness + Breadcrumbs ----- */}
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: 'KEY TO HEART',
                url: 'https://keytoheart.ru',
                description:
                  'Клубника в шоколаде, цветы и подарки с доставкой в Краснодаре — от 60 минут, с 9:00 до 22:00.',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://keytoheart.ru/search?q={search_term_string}',
                  },
                  'query-input': 'required name=search_term_string',
                },
              } as WebSite,
              {
                '@type': 'Organization',
                name: 'KEY TO HEART',
                url: 'https://keytoheart.ru',
                logo: 'https://keytoheart.ru/logo.svg',
                sameAs: [
                  'https://www.instagram.com/keytoheart.ru/',
                  'https://t.me/keytoheart',
                  'https://wa.me/79886033821',
                ],
              } as Organization,
              {
                '@type': 'LocalBusiness',
                name: 'KEY TO HEART',
                url: 'https://keytoheart.ru',
                telephone: '+7-988-603-38-21',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'ул. Героев-Разведчиков, 17/1',
                  addressLocality: 'Краснодар',
                  addressRegion: 'Краснодарский край',
                  postalCode: '350028',
                  addressCountry: 'RU',
                },
                openingHours: ['Mo-Su 09:00-22:00'],
              } as LocalBusiness,
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
              } as BreadcrumbList,
            ],
          }}
        />

        {/* -------- Яндекс.Метрика -------- */}
        {YM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0];
                k.async=1;k.src=r;a.parentNode.insertBefore(k,a);})
                  (window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
                ym(${YM_ID}, 'init', {
                  clickmap:true,
                  trackLinks:true,
                  accurateTrackBounce:true,
                  trackHash:true,
                  webvisor:true
                });
              `,
            }}
          />
        )}
      </head>

      <body>
        <LayoutClient categories={categories}>{children}</LayoutClient>
      </body>
    </html>
  );
}
