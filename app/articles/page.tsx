import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { Article, FAQPage, WebPage } from 'schema-dts';
import ArticlesPageClient from '@components/ArticlesPageClient';

export const metadata: Metadata = {
  title: 'Статьи о клубничных букетах и подарках | KEY TO HEART',
  description: 'Читайте полезные статьи о клубничных букетах, подарках и доставке в Краснодаре от KEY TO HEART. Советы и идеи для идеального подарка!',
  keywords: [
    'статьи о клубничных букетах', 'подарки Краснодар', 'идеи подарков', 'доставка букетов Краснодар',
    'цветочные композиции', 'KEY TO HEART', 'советы по букетам',
  ],
  openGraph: {
    title: 'Статьи о клубничных букетах | KEY TO HEART',
    description: 'Откройте секреты создания идеальных букетов с доставкой в Краснодаре от KEY TO HEART.',
    url: 'https://keytoheart.ru/articles',
    siteName: 'KEY TO HEART',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-articles.jpg',
        width: 1200,
        height: 630,
        alt: 'Статьи о клубничных букетах KEY TO HEART',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Статьи о подарках и букетах | KEY TO HEART',
    description: 'Узнайте, как выбрать лучший букет или подарок с доставкой в Краснодаре от KEY TO HEART.',
    images: ['https://keytoheart.ru/og-image-articles.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/articles' },
};

export const revalidate = 86400;

const articleSchema: Article = {
  '@type': 'Article',
  headline: 'Почему клубничные букеты — лучший подарок в 2025 году',
  description: 'Узнайте, почему клубничные букеты от KEY TO HEART покоряют сердца в Краснодаре в 2025 году.',
  author: {
    '@type': 'Organization',
    name: 'KEY TO HEART',
    url: 'https://keytoheart.ru',
  },
  publisher: {
    '@type': 'Organization',
    name: 'KEY TO HEART',
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
      name: 'Как долго свежи клубничные букеты от KEY TO HEART?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Клубничные букеты сохраняют свежесть до 24 часов при хранении в прохладе. Доставляем их в Краснодаре в день заказа!',
      },
    },
    {
      '@type': 'Question',
      name: 'Доступна ли доставка букетов в Краснодаре?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Да, доставка клубничных букетов по Краснодару — за 60 минут! Заказывайте онлайн 24/7 на KEY TO HEART.',
      },
    },
    {
      '@type': 'Question',
      name: 'Какой букет выбрать для подарка в 2025?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Выбирайте по поводу: для дня рождения — яркие букеты, для романтики — с шоколадом. Консультируем в Краснодаре 24/7!',
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
          name: 'Статьи о клубничных букетах и подарках | KEY TO HEART',
          url: 'https://keytoheart.ru/articles',
          description: 'Полезные советы о клубничных букетах, подарках и доставке в Краснодаре от KEY TO HEART.',
          mainEntity: {
            '@type': 'Organization',
            name: 'KEY TO HEART',
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