// ✅  app/layout.tsx
import './styles/globals.css';
import 'react-image-gallery/styles/css/image-gallery.css';

import localFont from 'next/font/local';
import { Metadata, Viewport } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { BreadcrumbList, LocalBusiness, WebSite } from 'schema-dts';
import Script from 'next/script';
import { Suspense } from 'react';

import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import Footer from '@components/Footer';
import CookieBanner from '@components/CookieBanner';
import ClientBreadcrumbs from '@components/ClientBreadcrumbs';
import PromoFooterBlock from '@components/PromoFooterBlock';
import MobileContactFab from '@components/MobileContactFab';
import SkipLink from '@components/SkipLink';

import YandexMetrikaScript from '@components/YandexMetrikaScript';

import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';
import { Category } from '@/types/category';
import { YM_ID } from '@/utils/ym';

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
    default:
      'Клубничные букеты, цветы и подарки в Краснодаре — доставка 60 мин | KEY TO HEART',
    template: '%s | KEY TO HEART',
  },
  description:
    'Клубничные букеты, свежие цветы и подарочные боксы с доставкой за 60 мин по Краснодару. Работаем круглосуточно, заказы онлайн 24/7.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KEY TO HEART',
    url: 'https://keytoheart.ru',
    title:
      'Клубничные букеты, цветы и подарки в Краснодаре — доставка 60 мин | KEY TO HEART',
    description:
      'Закажите клубничные букеты, свежие цветы и подарочные боксы с экспресс-доставкой по Краснодару. Работаем 24/7.',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничные букеты KEY TO HEART',
        type: 'image/webp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KEY TO HEART — клубничные букеты и подарки в Краснодаре',
    description:
      'Свежие цветы и клубничные боксы с доставкой за 60 мин по Краснодару. Онлайн-заказ 24/7.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/* ------------------------------------------------------------------ */
/*                             LAYOUT                                 */
/* ------------------------------------------------------------------ */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let categories: Category[] = [];
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=id,name,slug,is_visible,subcategories!subcategories_category_id_fkey(id,name,slug,is_visible)&is_visible=eq.true&order=id.asc`,
      { headers: { apikey: supabaseKey }, next: { revalidate: 3600 } }
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

  const ymId = YM_ID;

  return (
    <html lang="ru" className={`${golosText.variable} ${marqueeFont.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="yandex-verification" content="2d95e0ee66415497" />
        <meta name="geo.region" content="RU-KDA" />
        <meta name="geo.placename" content="Краснодар" />
        <meta name="geo.position" content="45.035470;38.975313" />

        <link
          rel="preconnect"
          href="https://gwbeabfkknhewwoesqax.supabase.co"
          crossOrigin="anonymous"
        />

        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: 'KEY TO HEART',
                url: 'https://keytoheart.ru',
                description:
                  'Клубничные букеты, свежие цветы и подарочные боксы с доставкой за 60 мин по Краснодару.',
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
      </head>
      <body className="font-sans">
        {ymId !== undefined && <YandexMetrikaScript ymId={ymId} />}

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

            <section
              role="region"
              aria-label="О магазине"
              className="mx-auto mt-8 mb-12 max-w-5xl px-4 text-[15px] leading-6 text-gray-700"
            >
              <h2 className="mb-2 text-lg font-semibold">
                Почему выбирают KEY TO HEART?
              </h2>
              <p className="mb-3">
                Мы готовим клубничные букеты из свежей фермерской ягоды и
                настоящего бельгийского шоколада, а также цветочные композиции
                и комбо-наборы. Каждый заказ собирается вручную прямо перед
                отправкой и доставляется по Краснодару — всего за 60 минут.
              </p>
              <p className="mb-3">
                Фото готового подарка отправляем вам перед доставкой, работаем
                онлайн 24/7 и бережно упаковываем любую композицию — от
                мини-букета до корпоративного заказа.
              </p>
              <h3 className="mb-1 font-medium">Популярные поводы</h3>
              <ul className="list-disc pl-6">
                <li>8 Марта и 14 Февраля</li>
                <li>День рождения и юбилей</li>
                <li>Годовщина отношений или свадьбы</li>
                <li>Выписка из роддома</li>
                <li>День учителя и День мамы</li>
                <li>Корпоративные праздники и Новый год</li>
              </ul>
            </section>
          </CartProvider>
        </CartAnimationProvider>
      </body>
    </html>
  );
}
