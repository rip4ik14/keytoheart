import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { Article, FAQPage, WebPage } from 'schema-dts';
import ArticlesPageClient from '@components/ArticlesPageClient';

export const metadata: Metadata = {
  title: 'Статьи о клубничных букетах и подарках | KeyToHeart',
  description: 'Полезные статьи о клубничных букетах, оригинальных подарках и доставке в Краснодаре от KeyToHeart. Узнайте, как выбрать идеальный букет для любого случая.',
  keywords: [
    'клубничные букеты',
    'подарки Краснодар',
    'оригинальные подарки',
    'доставка букетов Краснодар',
    'цветочные композиции',
    'KeyToHeart',
    'статьи',
  ],
  openGraph: {
    title: 'Статьи о клубничных букетах и подарках | KeyToHeart',
    description: 'Узнайте всё о клубничных букетах, подарках и доставке в Краснодаре от KeyToHeart.',
    url: 'https://keytoheart.ru/articles',
    siteName: 'KeyToHeart',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-articles.jpg',
        width: 1200,
        height: 630,
        alt: 'Статьи о клубничных букетах KeyToHeart',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Статьи о клубничных букетах и подарках | KeyToHeart',
    description: 'Узнайте всё о клубничных букетах, подарках и доставке в Краснодаре от KeyToHeart.',
    images: ['https://keytoheart.ru/og-image-articles.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/articles' },
};

export const revalidate = 86400;

const articleSchema: Article = {
  '@type': 'Article',
  headline: 'Почему клубничные букеты – идеальный подарок для любого случая',
  description: 'Узнайте, почему клубничные букеты от KeyToHeart – это уникальный и запоминающийся подарок для любого события.',
  author: {
    '@type': 'Organization',
    name: 'KeyToHeart',
    url: 'https://keytoheart.ru',
  },
  publisher: {
    '@type': 'Organization',
    name: 'KeyToHeart',
    logo: {
      '@type': 'ImageObject',
      url: 'https://keytoheart.ru/logo.png',
    },
  },
  datePublished: '2025-05-20',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://keytoheart.ru/articles',
  },
};

const faqSchema: FAQPage = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Как долго хранятся клубничные букеты?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Клубничные букеты от KeyToHeart сохраняют свежесть до 24 часов при правильном хранении в прохладном месте. Мы используем только свежие ягоды и рекомендуем дарить букет в день доставки.',
      },
    },
    {
      '@type': 'Question',
      name: 'Можно ли заказать доставку клубничного букета в Краснодаре?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Да, KeyToHeart предлагает быструю доставку клубничных букетов по Краснодару. Вы можете выбрать удобное время доставки при оформлении заказа.',
      },
    },
    {
      '@type': 'Question',
      name: 'Как выбрать букет для особого случая?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы предлагаем букеты разных размеров и дизайна для дней рождения, свадеб, юбилеев и других событий. Свяжитесь с нашими менеджерами, чтобы подобрать идеальный вариант!',
      },
    },
  ],
};

export default function ArticlesPage() {
  return (
    <main
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white text-black min-h-screen"
      aria-label="Статьи"
    >
      <JsonLd<Article> item={articleSchema} />
      <JsonLd<FAQPage> item={faqSchema} />
      <JsonLd<WebPage>
        item={{
          '@type': 'WebPage',
          name: 'Статьи о клубничных букетах и подарках | KeyToHeart',
          url: 'https://keytoheart.ru/articles',
          description: 'Полезные статьи о клубничных букетах, подарках и доставке в Краснодаре от KeyToHeart.',
          mainEntity: {
            '@type': 'Organization',
            name: 'KeyToHeart',
            url: 'https://keytoheart.ru',
            contactPoint: {
              '@type': 'ContactPoint',
              email: 'info@keytoheart.ru',
              telephone: '+7-988-603-38-21',
              contactType: 'customer service',
            },
          },
        }}
      />
      <ArticlesPageClient />
    </main>
  );
}