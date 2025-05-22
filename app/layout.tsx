// ✅ Путь: app/layout.tsx
import './styles/globals.css';
import './styles/fonts.css';
import 'react-image-gallery/styles/css/image-gallery.css';

import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { JsonLd } from 'react-schemaorg';
import type { BreadcrumbList, LocalBusiness, WebSite } from 'schema-dts';

import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import Footer from '@components/Footer';
import CookieBanner from '@components/CookieBanner';
import ClientBreadcrumbs from '@components/ClientBreadcrumbs';

import { CartProvider } from '@context/CartContext';
import { CartAnimationProvider } from '@context/CartAnimationContext';

import SupabaseProvider from './providers/SupabaseProvider';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';
import { Category } from '@/types/category';

export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL('https://keytoheart.ru'),
  title: {
    default: 'Клубничные букеты, цветы и подарки с доставкой в Краснодаре | KeyToHeart',
    template: '%s | KeyToHeart',
  },
  description:
    'Закажите клубничные букеты, свежие цветы и подарочные боксы с доставкой по Краснодаре. KeyToHeart — идеальные подарки на 8 марта, Новый год, День Победы и любой праздник! Доставка 24/7.',
  keywords: [
    'клубничные букеты Краснодар',
    'доставка цветов Краснодар',
    'подарки Краснодар',
    'цветы Краснодар',
    'подарочные боксы Краснодар',
    'KeyToHeart',
  ],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KeyToHeart',
    url: 'https://keytoheart.ru',
    title: 'Клубничные букеты, цветы и подарки с доставкой в Краснодаре | KeyToHeart',
    description:
      'Закажите клубничные букеты, свежие цветы и подарочные боксы с доставкой по Краснодаре. KeyToHeart — идеальные подарки на любой праздник!',
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
      'Закажите клубничные букеты, свежие цветы и подарочные боксы с доставкой по Краснодаре.',
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
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) console.error('Supabase getUser error:', userError);

  let categories: Category[] = [];

  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        is_visible,
        subcategories!subcategories_category_id_fkey(
          id,
          name,
          slug,
          is_visible
        )
      `)
      .eq('is_visible', true)
      .order('id', { ascending: true });

    if (error) throw error;
    if (Array.isArray(data)) {
      categories = data.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        is_visible: cat.is_visible ?? true,
        subcategories:
          cat.subcategories
            ?.filter((s) => s.is_visible)
            .map((s) => ({
              id: s.id,
              name: s.name,
              slug: s.slug,
              is_visible: s.is_visible ?? true,
            })) ?? [],
      }));
    }
  } catch (err) {
    console.error('Ошибка загрузки категорий в layout:', err);
  }

  const ymId = process.env.NEXT_PUBLIC_YM_ID;

  return (
    <html lang="ru">
      <head>
        <meta name="yandex-verification" content="2d95e0ee66415497" />
        <meta name="geo.region" content="RU-KDA" />
        <meta name="geo.placename" content="Краснодар" />
        <meta name="geo.position" content="45.035470;38.975313" />
        <link rel="preload" href="/og-cover.jpg" as="image" fetchPriority="high" />
        <JsonLd<WebSite>
          item={{
            '@type': 'WebSite',
            name: 'KeyToHeart',
            url: 'https://keytoheart.ru',
            description:
              'Клубничные букеты, свежие цветы и подарочные боксы с доставкой по Краснодаре.',
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
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              opens: '08:00',
              closes: '22:00',
            },
          }}
        />
        {ymId && (
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`
              (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){
                  (m[i].a=m[i].a||[]).push(arguments)
                };
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {
                  if (document.scripts[j].src === r) { return; }
                }
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
              })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym(${ymId}, "init", {
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                ecommerce: "dataLayer"
              });
            `}
          </Script>
        )}
      </head>
      <body className="bg-white font-sans">
        <CartAnimationProvider>
          <SupabaseProvider initialUser={user}>
            <CartProvider>
              <TopBar />
              <StickyHeader initialCategories={categories} />
              <ClientBreadcrumbs />
              <main className="pt-12 sm:pt-14" aria-label="Основной контент">
                {children}
              </main>
              <Footer />
              <CookieBanner />
            </CartProvider>
          </SupabaseProvider>
        </CartAnimationProvider>
      </body>
    </html>
  );
}