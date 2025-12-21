// app/articles/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from 'react-schemaorg';
import type { Article as ArticleSchema, WebPage } from 'schema-dts';
import { articles } from '@/lib/articles';

interface Params {
  params: { slug: string };
}

export async function generateStaticParams() {
  return articles.map(a => ({ slug: a.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const article = articles.find(a => a.slug === params.slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `https://keytoheart.ru/articles/${article.slug}` },
  };
}

export default function ArticlePage({ params }: Params) {
  const article = articles.find(a => a.slug === params.slug);
  if (!article) notFound();

  const articleLd: ArticleSchema = {
    '@type': 'Article',
    headline: article.title,
    description: article.description,
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
    datePublished: article.datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://keytoheart.ru/articles/${article.slug}`,
    },
  };

  const pageLd: WebPage = {
    '@type': 'WebPage',
    name: article.title,
    url: `https://keytoheart.ru/articles/${article.slug}`,
    description: article.description,
  };

  return (
    <main className="container mx-auto px-4 py-12 bg-white text-black min-h-screen">
      <JsonLd<ArticleSchema> item={articleLd} />
      <JsonLd<WebPage> item={pageLd} />
      {article.content}
    </main>
  );
}
