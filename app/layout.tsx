// app/layout.tsx
import './styles/globals.css';
import 'react-image-gallery/styles/css/image-gallery.css';
import localFont from 'next/font/local';
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
import SkipLink from '@components/SkipLink';

import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';
import { Category } from '@/types/category';
import { YM_ID } from '@/utils/ym';

/* === Локальные шрифты (swap, preload > Early-Hints) === */
const golosText = localFont({
  variable: '--font-golos',
  display: 'swap',
  src: [
    { path: '../public/fonts/golos-text_regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/golos-text_medium.woff2',  weight: '500', style: 'normal' },
    { path: '../public/fonts/golos-text_demibold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/golos-text_bold.woff2',    weight: '700', style: 'normal' },
    { path: '../public/fonts/golos-text_black.woff2',   weight: '900', style: 'normal' },
  ],
});
const marqueeFont = localFont({
  variable: '--font-marquee',
  display: 'swap',
  src: '../public/fonts/MontserratMarquee.woff2',
});

/* === SEO: базовые мета-данные для всех страниц === */
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL('https://keytoheart.ru'),
  title: {
    default: 'Клубничные букеты, цветы и подарки в Краснодаре — доставка 60 мин | KeyToHeart',
    template: '%s | KeyToHeart',
  },
  description:
    'Клубничные букеты, свежие цветы и подарочные боксы с доставкой за 60 мин по Краснодару. Бесплатная открытка и фото перед отправкой. Заказывайте онлайн 24/7!',
  /*  ⤵ Meta keywords сегодня игнорируются ПС, поэтому убираем */
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KeyToHeart',
    url: 'https://keytoheart.ru',
    title: 'Клубничные букеты, цветы и подарки в Краснодаре — доставка 60 мин | KeyToHeart',
    description:
      'Закажите клубничные букеты, свежие цветы и подарочные боксы с экспресс-доставкой по Краснодару. Работаем круглосуточно.',
    images: [
      {
        url: '/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничные букеты KeyToHeart',
        type: 'image/webp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeyToHeart — клубничные букеты и подарки в Краснодаре',
    description:
      'Свежие цветы и клубничные боксы с доставкой за 60 мин. Бесплатная открытка к каждому заказу!',
    images: ['/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/* ==================================================================== */

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /* --- Загружаем категории раз в час для шапки / футера --- */
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
    process.env.NODE_ENV !== 'production' && console.error('RootLayout: categories fetch error', e);
  }

  const ymId = YM_ID;

  return (
    <html lang="ru" className={`${golosText.variable} ${marqueeFont.variable}`}>
      <head>
        {/* Яндекс-верификация + гео */}
        <meta name="yandex-verification" content="2d95e0ee66415497" />
        <meta name="geo.region" content="RU-KDA" />
        <meta name="geo.placename" content="Краснодар" />
        <meta name="geo.position" content="45.035470;38.975313" />
        {/* Preconnect Supabase CDN */}
        <link rel="preconnect" href="https://gwbeabfkknhewwoesqax.supabase.co" crossOrigin="" />

        {/* === JSON-LD базовый === */}
        <JsonLd<WebSite>
          item={{
            '@type': 'WebSite',
            name: 'KeyToHeart',
            url: 'https://keytoheart.ru',
            description:
              'Клубничные букеты, свежие цветы и подарочные боксы с доставкой за 60 мин по Краснодару.',
          }}
        />
        <JsonLd<LocalBusiness>
          item={{
            '@type': 'LocalBusiness',
            name: 'KeyToHeart',
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
              opens: '08:00',
              closes: '22:00',
            },
          }}
        />
        <JsonLd<BreadcrumbList>
          item={{
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://keytoheart.ru' },
            ],
          }}
        />

        {/* Яндекс Метрика - подгружаем лениво */}
        {ymId && (
          <Script id="ym" strategy="lazyOnload">
            {`
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0];
              k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})
              (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
              ym("${ymId}", "init", {clickmap:true,trackLinks:true,accurateTrackBounce:true,trackHash:true,webvisor:true});
            `}
          </Script>
        )}
      </head>

      <body className="font-sans">
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

            {/* SEO-текст для людей, не «скрытый» */}
            <section className="mx-auto mt-8 mb-12 max-w-5xl px-4 text-[15px] leading-6 text-gray-700">
              <h2 className="mb-2 text-lg font-semibold">Почему выбирают KeyToHeart?</h2>
              <p className="mb-3">
                Мы готовим клубничные букеты из охлаждённой фермерской ягоды и бельгийского
                шоколада — заказывайте прямо сейчас и получите бесплатную открытку. Доставка по
                Краснодару&nbsp;— всего за&nbsp;60&nbsp;минут.
              </p>
              <h3 className="mb-1 font-medium">Популярные поводы</h3>
              <ul className="list-disc pl-6">
                <li>8 Марта и 14 Февраля</li>
                <li>День&nbsp;рождения и юбилей</li>
                <li>Выпускной и&nbsp;День&nbsp;учителя</li>
                <li>Годовщина свадьбы</li>
              </ul>
            </section>
          </CartProvider>
        </CartAnimationProvider>
      </body>
    </html>
  );
}
