/* -------------------------------------------------------------------------- */
/*  Root layout с техническими + SEO-улучшениями                              */
/* -------------------------------------------------------------------------- */
import './styles/globals.css';
import 'react-image-gallery/styles/css/image-gallery.css';

import localFont from 'next/font/local';
import { Metadata, Viewport } from 'next';
import { JsonLd } from 'react-schemaorg';
import type {
  BreadcrumbList,
  LocalBusiness,
  WebSite,
  SearchAction,          // NEW: SearchAction
} from 'schema-dts';
import { Suspense } from 'react';

import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import Footer from '@components/Footer';
import CookieBanner from '@components/CookieBanner';
import ClientBreadcrumbs from '@components/ClientBreadcrumbs';
import PromoFooterBlock from '@components/PromoFooterBlock';
import MobileContactFab from '@components/MobileContactFab';
import SkipLink from '@components/SkipLink';

import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';
import { Category } from '@/types/category';
import { YM_ID } from '@/utils/ym';

/* ------------------------------------------------------------------ */
/*                               ШРИФТЫ                               */
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
  preload: true, // CHANGED: true → исключаем FOIT
  src: [{ path: '../public/fonts/MontserratMarquee.woff2', weight: '900', style: 'normal' }],
});

/* ------------------------------------------------------------------ */
/*                       БАЗОВЫЕ SEO-МЕТАДАННЫЕ                       */
/* ------------------------------------------------------------------ */
export const revalidate = 3600; // каждую час

export const metadata: Metadata = {
  metadataBase: new URL('https://keytoheart.ru'),
  title: {
    default: 'Клубничные букеты с доставкой за 60 мин в Краснодаре | KEY TO HEART', // CHANGED: ≤ 65 симв.
    template: '%s | KEY TO HEART',
  },
  description:
    'Свежие клубничные букеты, цветы и подарки с доставкой 24/7 за 60 мин по Краснодару. Сделайте яркий сюрприз вместе с KEY TO HEART!',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KEY TO HEART',
    url: 'https://keytoheart.ru',
    title: 'Клубничные букеты с доставкой за 60 мин в Краснодаре | KEY TO HEART',
    description:
      'Удивите близких за час! Клубничные букеты, цветы и подарочные наборы с быстрой доставкой по Краснодару.',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничные букеты и цветы KEY TO HEART в Краснодаре',
        type: 'image/webp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Клубничные букеты и подарки в Краснодаре | KEY TO HEART',
    description: 'Доставка свежих букетов и подарков 24/7 за 60 мин по Краснодару.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: {
    canonical: 'https://keytoheart.ru',
    languages: { 'ru-RU': '/', 'x-default': '/' }, // NEW: hreflang
  },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/* ------------------------------------------------------------------ */
/*                              LAYOUT                                */
/* ------------------------------------------------------------------ */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // NEW: кэшируем категории жёстко — убираем revalidate=3600 из fetch
  const categories: Category[] = await getCategories(supabaseUrl, supabaseKey);

  return (
    <html lang="ru" className={`${golosText.variable} ${marqueeFont.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="robots" content="index,follow" /> {/* NEW */}
        <link rel="sitemap" href="/sitemap.xml" type="application/xml" /> {/* NEW */}
        <link rel="manifest" href="/manifest.webmanifest" /> {/* NEW */}

        {/* Гео-метки для Яндекса */}
        <meta name="yandex-verification" content="2d95e0ee66415497" />
        <meta name="geo.region" content="RU-KDA" />
        <meta name="geo.placename" content="Краснодар" />
        <meta name="geo.position" content="45.035470;38.975313" />

        {/* Preconnect к Supabase */}
        <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />

        {/* Preload hero-изображения для быстрой LCP */}
        <link
          rel="preload"
          as="image"
          href="/hero.webp"
          fetchPriority="high"
          type="image/webp"
        /> {/* NEW */}

        {/* ---------- Schema.org ---------- */}
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: 'KEY TO HEART',
                url: 'https://keytoheart.ru',
                description:
                  'Клубничные букеты, цветы и подарки с доставкой за 60 мин по Краснодару.',
                potentialAction: {
                  '@type': 'SearchAction',         // NEW: виджет поиска в сниппете
                  target: 'https://keytoheart.ru/search?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                } as SearchAction,
              } satisfies WebSite,
              {
                '@type': 'LocalBusiness',
                name: 'KEY TO HEART',
                url: 'https://keytoheart.ru',
                telephone: '+7-988-603-38-21',
                email: 'info@keytoheart.ru',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Краснодар',
                  addressRegion: 'Краснодарский край',
                  addressCountry: 'RU',
                },
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
                  opens: '00:00',
                  closes: '23:59',
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

        {/* Яндекс.Метрика — lazy + без блокировки main-потока */}
        {YM_ID && (
          <script
            defer // NEW
            dangerouslySetInnerHTML={{
              __html: `
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0];
              k.defer=1;k.src=r;a.parentNode.insertBefore(k,a);
              })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym(${YM_ID}, "init", {
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

      <body className="font-sans antialiased">
        <SkipLink />

        <CartAnimationProvider>
          <CartProvider>
            <TopBar />
            <StickyHeader initialCategories={categories} />

            <Suspense fallback={<div>Загрузка…</div>}>
              <ClientBreadcrumbs />
            </Suspense>

            <main id="main-content" tabIndex={-1} className="pt-12 sm:pt-14">
              {children}
            </main>

            <PromoFooterBlock />
            <Footer categories={categories} />
            <CookieBanner />
            <MobileContactFab />

            {/* SEO-текст (оставляем) */}
            <section
              role="region"
              aria-label="О магазине"
              className="mx-auto mt-8 mb-12 max-w-5xl px-4 text-[15px] leading-6 text-gray-700"
            >
              <h2 className="mb-2 text-lg font-semibold">Почему выбирают KEY TO HEART?</h2>
              <p className="mb-3">
                Мы создаём клубничные букеты из свежайшей ягоды и бельгийского шоколада,
                а также цветочные шедевры и подарочные наборы. Каждый заказ — ручная работа,
                доставка по Краснодару за 60 минут!
              </p>
              <p className="mb-3">
                Фото готового сюрприза присылаем перед доставкой. Работаем 24/7,
                бережно упаковываем — от мини-букета до корпоративного подарка.
              </p>

              {/* NEW: перелинковка + LSI-ключи */}
              <h3 className="mb-1 font-medium">Популярные поводы</h3>
              <ul className="list-disc pl-6">
                <li><a href="/povod/8-marta">8 Марта</a> и 14 Февраля</li>
                <li><a href="/povod/den-rozhdeniya">День рождения</a> и юбилей</li>
                <li><a href="/povod/godovshchina">Годовщина</a> и свадьба</li>
                <li>Выписка из роддома</li>
                <li>День учителя и День матери</li>
                <li>Корпоративы и Новый год</li>
              </ul>
            </section>
          </CartProvider>
        </CartAnimationProvider>
      </body>
    </html>
  );
}

/* ------------------------------------------------------------------ */
/*                utils: кешированный запрос категорий                */
/* ------------------------------------------------------------------ */
async function getCategories(supabaseUrl: string, supabaseKey: string) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=id,name,slug,is_visible,subcategories!subcategories_category_id_fkey(id,name,slug,is_visible)&is_visible=eq.true&order=id.asc`,
      {
        headers: { apikey: supabaseKey },
        cache: 'force-cache',                     // NEW: вместо revalidate в Layout
        next: { tags: ['categories'] },
      },
    );

    const data = (await res.json()) as any[];
    return Array.isArray(data)
      ? data.map((c) => ({
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
        }))
      : [];
  } catch (e) {
    process.env.NODE_ENV !== 'production' &&
      console.warn('[layout] categories fetch error →', e);
    return [];
  }
}
