// app/articles/page.tsx
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts';
import ArticlesList from '@/components/ArticlesList';

export const metadata: Metadata = {
  title: 'Полезные статьи',
  description:
    'Читайте советы и идеи по клубничным букетам, декору и подаркам от КЛЮЧ К СЕРДЦУ.',
  alternates: { canonical: 'https://keytoheart.ru/articles' },
};

export default function ArticlesPage() {
  const pageSchema: WebPage = {
    '@type': 'WebPage',
    name: 'Полезные статьи | КЛЮЧ К СЕРДЦУ',
    url: 'https://keytoheart.ru/articles',
    description:
      'Блог КЛЮЧ К СЕРДЦУ: идеи и лайфхаки по клубничным букетам и подаркам.',
  };

  return (
    <main className="container mx-auto px-4 py-12 bg-white text-black min-h-screen" aria-label="Статьи">
      <JsonLd<WebPage> item={pageSchema} />
      <ArticlesList />
    </main>
  );
}
