// ✅ Путь: app/layout.tsx
import './styles/globals.min.css';
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

import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';
import { Category } from '@/types/category';
import { YM_ID } from '@/utils/ym';

/* ---------------------- шрифты ---------------------- */
const golos = localFont({
  variable: '--font-golos',
  display: 'swap',
  preload: true,
  src: [
    { path: '../public/fonts/golos-text_regular.woff2', weight: '400' },
    { path: '../public/fonts/golos-text_demibold.woff2', weight: '600' },
  ],
});
const marquee = localFont({
  variable: '--font-marquee',
  display: 'swap',
  src: [{ path: '../public/fonts/MontserratMarquee.woff2', weight: '900' }],
});

/* ---------------------- meta ------------------------ */
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL('https://keytoheart.ru'),
  title: {
    default: 'Клубничные букеты, цветы и подарки в Краснодаре — KEY TO HEART',
    template: '%s | KEY TO HEART',
  },
  description:
    'Свежие клубничные букеты, цветы и подарочные боксы с доставкой 24/7 по Краснодару. Фото перед отправкой, 60-минутное экспресс-доставление.',
  keywords: [
    'клубничные букеты Краснодар',
    'клубника в шоколаде',
    'доставка цветов Краснодар',
    'подарочные боксы Краснодар',
    'букеты из фруктов',
    'экспресс доставка 60 минут',
  ],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KEY TO HEART',
    url: 'https://keytoheart.ru',
    title: 'Клубничные букеты и цветы — доставка 60 мин | KEY TO HEART',
    description:
      'Клубничные букеты, бельгийский шоколад и свежие цветы с доставкой за час по Краснодару. Работаем круглосуточно.',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничные букеты и цветы KEY TO HEART',
        type: 'image/webp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Клубничные букеты и цветы | KEY TO HEART',
    description:
      'Свежие ягоды, бельгийский шоколад, доставка 24/7 по Краснодару. Заказывайте онлайн!',
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

/* ---------------------- layout ---------------------- */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* загружаем категории из Supabase */
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  let categories: Category[] = [];
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=id,name,slug,is_visible,subcategories!subcategories_category_id_fkey(id,name,slug,is_visible)&is_visible=eq.true&order=id.asc`,
      { headers: { apikey: supabaseKey }, next: { revalidate: 3600 } },
    );
    const raw = await res.json();
    categories = Array.isArray(raw)
      ? raw.map((c: any) => ({
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
  } catch {
    categories = [];
  }

  return (
    <html lang="ru" className={`${golos.variable} ${marquee.variable}`}>
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
        {/* preload главного баннера (LCP) */}
        <link
          rel="preload"
          as="image"
          fetchPriority="high"
          href="https://keytoheart.ru/_next/image?url=%2Fhero.webp&w=1200&q=75"
        />
        <style>{`body{font-family:var(--font-golos);} h1,h2,h3{font-weight:600;}`}</style>

        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: 'KEY TO HEART',
                url: 'https://keytoheart.ru',
                description:
                  'Клубничные букеты, цветы и подарочные боксы с доставкой за 60 мин по Краснодару.',
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

        {YM_ID && (
          <Script
            id="ym-tag"
            src="https://mc.yandex.ru/metrika/tag.js"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0];
                k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})
                (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
                ym(${YM_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
              `,
            }}
          />
        )}
      </head>

      <body className="font-sans">
        <SkipLink />

        <CartAnimationProvider>
          <CartProvider>
            <header>
              <TopBar />
              <StickyHeader initialCategories={categories} />
            </header>

            <Suspense fallback={<div>Загрузка…</div>}>
              <ClientBreadcrumbs />
            </Suspense>

            <main id="main-content" tabIndex={-1} className="pt-12 sm:pt-14">
              {children}
            </main>

            <footer>
              <PromoFooterBlock />
              <Suspense
                fallback={<div className="py-8 text-center">Загрузка SEO-текста…</div>}
              >
                <section
                  aria-label="О магазине"
                  className="mx-auto max-w-5xl px-4 mt-8 mb-12 text-[15px] leading-6 text-gray-700"
                >
                  <h2 className="font-semibold text-lg mb-2">
                    Почему выбирают KEY TO HEART?
                  </h2>
                  <p className="mb-3">
                    Свежие ягоды, бельгийский шоколад и дизайнерские букеты.
                    Доставляем по Краснодару <strong>за 60 минут</strong>, работаем
                    24 / 7, присылаем фото перед отправкой, дарим бонусы.
                  </p>
                  <p>
                    <strong>Популярные поводы:</strong> 8 Марта, 14 Февраля,
                    день рождения, годовщина, выписка из роддома, корпоративные подарки.
                  </p>
                </section>
              </Suspense>

              <Footer categories={categories} />
              <CookieBanner />
              <MobileContactFab />
            </footer>
          </CartProvider>
        </CartAnimationProvider>
      </body>
    </html>
  );
}
