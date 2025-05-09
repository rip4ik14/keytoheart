import './styles/globals.css';
import './styles/fonts.css';
import 'react-image-gallery/styles/css/image-gallery.css';
import { Metadata, Viewport } from 'next';
import { JsonLd } from 'react-schemaorg';
import TopBar from '@components/TopBar';
import StickyHeader from '@components/StickyHeader';
import Footer from '@components/Footer';
import CookieBanner from '@components/CookieBanner';
import StoreBanner from '@components/StoreBanner';
import ClientBreadcrumbs from '@components/ClientBreadcrumbs'; // Новый клиентский компонент
import { CartProvider } from '@context/CartContext';
import SupabaseProvider from './providers/SupabaseProvider';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types_new';

type Category = {
  id: number;
  name: string;
  slug: string;
  subcategories: { id: number; name: string; slug: string }[];
};

export const revalidate = 3600; // Кэшируем на 1 час

export const metadata: Metadata = {
  metadataBase: new URL('https://keytoheart.ru'),
  title: { default: 'KeyToHeart — букеты и подарки', template: '%s | KeyToHeart' },
  description: 'Свежие цветы, клубничные букеты и подарочные боксы с доставкой по Краснодару.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KeyToHeart',
    url: 'https://keytoheart.ru',
    images: '/og-cover.jpg',
  },
  twitter: { card: 'summary_large_image' },
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
  const cookieStore = await cookies();
  const supabaseServer = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(cookieStore.getAll()).map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const startSession = Date.now();
  const {
    data: { session },
    error: sessionError,
  } = await supabaseServer.auth.getSession();
  console.log('Supabase query duration for session in layout:', Date.now() - startSession, 'ms');
  console.log('Session in layout:', { session, sessionError });

  let categories: Category[] = [];
  try {
    const startCategories = Date.now();
    const { data, error } = await supabaseServer
      .from('categories')
      .select(`
        id,
        name,
        slug,
        subcategories!subcategories_category_id_fkey(id, name, slug)
      `)
      .order('id', { ascending: true });
    console.log('Supabase query duration for categories in layout:', Date.now() - startCategories, 'ms');
    console.log('Categories fetch result:', { data, error });

    if (error) throw error;
    categories = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Ошибка загрузки категорий в layout:', err);
    categories = [];
  }

  return (
    <html lang="ru">
      <head>
        <link
          rel="preload"
          href="/fonts/Ubuntu-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Ubuntu-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'KeyToHeart',
            url: 'https://keytoheart.ru',
            description: 'Клубничные букеты и подарки с доставкой по Краснодару',
          }}
        />
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym('${process.env.NEXT_PUBLIC_YM_ID}', "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true });
            `,
          }}
        />
      </head>
      <body className="bg-white font-Ubuntu">
        <SupabaseProvider initialSession={session}>
          <CartProvider>
            <StoreBanner />
            <TopBar />
            <StickyHeader initialCategories={categories} />
            <ClientBreadcrumbs /> {/* Используем клиентский компонент */}
            <main className="pt-12 sm:pt-14" aria-label="Основной контент">
              {children}
            </main>
            <Footer />
            <CookieBanner />
          </CartProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}