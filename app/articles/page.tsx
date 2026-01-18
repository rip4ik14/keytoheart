// ✅ Путь: app/articles/page.tsx
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { WebPage } from 'schema-dts';
import ArticlesList from '@/components/ArticlesList';

export const metadata: Metadata = {
  title: 'Полезные статьи',
  description: 'Читайте советы и идеи по клубничным букетам, декору и подаркам от KEY TO HEART.',
  alternates: { canonical: 'https://keytoheart.ru/articles' },
};

export default function ArticlesPage() {
  const pageSchema: WebPage = {
    '@type': 'WebPage',
    name: 'Полезные статьи | KEY TO HEART',
    url: 'https://keytoheart.ru/articles',
    description: 'Блог KEY TO HEART: идеи и лайфхаки по клубничным букетам и подаркам.',
  };

  return (
    <main className="bg-white text-black min-h-screen" aria-label="Статьи">
      <JsonLd<WebPage> item={pageSchema} />

      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-10">
        <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Полезные статьи</h1>
          <p className="text-sm text-black/55 mt-2">
            Идеи подарков, советы по свежести, подборки под праздники, ответы на частые вопросы.
          </p>
        </div>

        <div className="mt-6">
          <ArticlesList />
        </div>
      </div>
    </main>
  );
}
