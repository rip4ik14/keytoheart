// app/layout.tsx

import './styles/globals.css'
import './styles/fonts.css'
import 'react-image-gallery/styles/css/image-gallery.css'

import { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { JsonLd } from 'react-schemaorg'

import TopBar from '@components/TopBar'
import StickyHeader from '@components/StickyHeader'
import Footer from '@components/Footer'
import CookieBanner from '@components/CookieBanner'
import ClientBreadcrumbs from '@components/ClientBreadcrumbs'

import { CartProvider } from '@context/CartContext'
import { CartAnimationProvider } from '@context/CartAnimationContext'

import SupabaseProvider from './providers/SupabaseProvider'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types_new'
import { Category } from '@/types/category'

export const revalidate = 3600

export const metadata: Metadata = {
  metadataBase: new URL('https://keytoheart.ru'),
  title: {
    default: 'KeyToHeart — букеты и подарки',
    template: '%s | KeyToHeart',
  },
  description:
    'Свежие цветы, клубничные букеты и подарочные боксы с доставкой по Краснодару.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KeyToHeart',
    url: 'https://keytoheart.ru',
    images: '/og-cover.jpg',
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ==== 1. создаём клиент для Server Components (+ он автоматически читает и пишет cookie) ====
  const supabase = createServerComponentClient<Database>({ cookies })

  // ==== 2. получаем пользователя ====
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) console.error('Supabase getUser error:', userError)

  // ==== 3. грузим категории ====
  let categories: Category[] = []

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
      .order('id', { ascending: true })

    if (error) throw error
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
      }))
    }
  } catch (err) {
    console.error('Ошибка загрузки категорий в layout:', err)
  }

  const ymId = process.env.NEXT_PUBLIC_YM_ID
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID

  return (
    <html lang="ru">
      <head>
        <meta name="yandex-verification" content="2d95e0ee66415497" />
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'KeyToHeart',
            url: 'https://keytoheart.ru',
            description:
              'Клубничные букеты и подарки с доставкой по Краснодару',
          }}
        />

        {ymId && (
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){
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
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true
              });
            `}
          </Script>
        )}

        {ga4Id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}');
              `}
            </Script>
          </>
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
  )
}
