// app/layout.tsx
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

// Если используешь Prisma только на сервере, импорт прямо тут:
import { PrismaClient } from '@prisma/client';

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
  const supabase = createServerComponentClient<Database>({ cookies });

  // Получаем пользователя через Supabase
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) console.error('Supabase getUser error:', userError);

  // Получаем категории из Supabase
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

  // Получаем бонусы пользователя через Prisma (по номеру телефона)
  let bonus: number | null = null;
  if (user?.phone) {
    // Нормализуем телефон к формату +7...
    let phone = user.phone.replace(/\D/g, '');
    if (phone.startsWith('8')) phone = '7' + phone.slice(1);
    if (!phone.startsWith('7')) phone = '7' + phone;
    phone = `+${phone.slice(0, 11)}`;
    // Получаем бонусы через Prisma
    const prisma = new PrismaClient();
    try {
      const bonuses = await prisma.bonuses.findUnique({
        where: { phone },
        select: { bonus_balance: true },
      });
      bonus = bonuses?.bonus_balance ?? 0;
    } catch (e) {
      console.error('Ошибка получения бонусов:', e);
    } finally {
      await prisma.$disconnect();
    }
  }

  const ymId = process.env.NEXT_PUBLIC_YM_ID;

  return (
    <html lang="ru">
      <head>
        <meta name="yandex-verification" content="2d95e0ee66415497" />
        <meta name="geo.region" content="RU-KDA" />
        <meta name="geo.placename" content="Краснодар" />
        <meta name="geo.position" content="45.035470;38.975313" />
        <link rel="preload" href="/_next/static/css/6bfcc40b5e423c29.css" as="style" />
        <link rel="preload" href="/og-cover.jpg" as="image" />
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
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
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
        {ymId && (
          <Script id="yandex-metrika" strategy="afterInteractive">
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
        {/* Yandex Turbo Pages */}
        <Script id="yandex-turbo" strategy="afterInteractive">
          {`
            (function() {
              var turboScript = document.createElement('script');
              turboScript.src = 'https://cdn.turbo.yandex.ru/turbo.js';
              turboScript.async = true;
              document.head.appendChild(turboScript);
            })();
          `}
        </Script>
      </head>
      <body className="bg-white font-sans">
        <CartAnimationProvider>
          <SupabaseProvider initialUser={user}>
            <CartProvider>
              <TopBar />
              <StickyHeader initialCategories={categories} isAuthenticated={!!user} bonus={bonus} />
              <ClientBreadcrumbs />
              <main className="pt-12 sm:pt-14" aria-label="Основной контент">
                {children}
              </main>
              <Footer />
              <CookieBanner />
              {/* Скрытый текст для SEO */}
              <div className="sr-only" aria-hidden="true">
                <p>
                  Клубничные букеты Краснодар, доставка цветов Краснодар, подарки Краснодар, цветы Краснодар, подарочные боксы Краснодар, подарки на 8 марта Краснодар, подарки на Новый год Краснодар, цветы на День Победы Краснодар, цветы на выпускной Краснодар, подарки на свадьбу Краснодар, цветы на 14 февраля Краснодар, доставка цветов недорого Краснодар, доставка цветов 24/7 Краснодар, заказать цветы Краснодар, клубничные букеты недорого Краснодар, подарки на день рождения Краснодар, подарки на юбилей Краснодар, подарки для девушки Краснодар, подарки для мужчины Краснодар, романтические подарки Краснодар, цветы на День учителя Краснодар, цветы на День матери Краснодар, подарки на 23 февраля Краснодар, эксклюзивные подарки Краснодар, подарки на годовщину Краснодар, доставка цветов на дом Краснодар, цветы оптом Краснодар, KeyToHeart
                </p>
              </div>
            </CartProvider>
          </SupabaseProvider>
        </CartAnimationProvider>
      </body>
    </html>
  );
}
