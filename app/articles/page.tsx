// app/articles/page.tsx
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts';
import ArticlesList from '@/components/ArticlesList';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Полезные статьи | KEY TO HEART',
  description:
    'Читайте советы и идеи по клубничным букетам, декору и подаркам от KEY TO HEART.',
  alternates: { canonical: 'https://keytoheart.ru/articles' },
};

export default function ArticlesPage() {
  const pageSchema: WebPage = {
    '@type': 'WebPage',
    name: 'Полезные статьи | KEY TO HEART',
    url: 'https://keytoheart.ru/articles',
    description:
      'Блог KEY TO HEART: идеи и лайфхаки по клубничным букетам и подаркам.',
  };

  return (
    <main className="container mx-auto px-4 py-12 bg-white text-black min-h-screen" aria-label="Статьи">
      <JsonLd<WebPage> item={pageSchema} />
      <ArticlesList />
    </main>
  );
}
