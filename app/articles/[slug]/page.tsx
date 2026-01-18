// ✅ Путь: app/articles/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from 'react-schemaorg';
import type { Article as ArticleSchema, WebPage } from 'schema-dts';

import Link from 'next/link';
import { articles } from '@/lib/articles';

interface Params {
  params: { slug: string };
}

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `https://keytoheart.ru/articles/${article.slug}` },
  };
}

export default function ArticlePage({ params }: Params) {
  const article = articles.find((a) => a.slug === params.slug);
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
    <main className="bg-white text-black min-h-screen" aria-label="Статья">
      <JsonLd<ArticleSchema> item={articleLd} />
      <JsonLd<WebPage> item={pageLd} />

      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-10">
        {/* top breadcrumb + title card */}
        <div className="space-y-4">
          <div className="text-sm text-black/55">
            <Link href="/" className="hover:underline">
              Главная
            </Link>
            <span className="px-2">/</span>
            <Link href="/articles" className="hover:underline">
              Полезные статьи
            </Link>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{article.title}</h1>
              <p className="text-sm text-black/55">{article.description}</p>
              <div className="text-xs text-black/45">
                Опубликовано: {new Date(article.datePublished).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* content + sidebar */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 items-start">
          {/* article */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              {/* твой контент как есть */}
              <div className="prose prose-sm sm:prose-base max-w-none prose-headings:tracking-tight prose-a:text-black prose-a:underline">
                {article.content}
              </div>
            </div>

            {/* bottom CTA */}
            <div className="mt-6 rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="text-lg font-semibold tracking-tight">Хотите такой же подарок сегодня?</div>
              <p className="text-sm text-black/60 mt-1">
                Откройте каталог и выберите готовый набор. Доставим по Краснодару, соберём аккуратно, пришлём фото перед выездом.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Link
                  href="/catalog"
                  className="rounded-2xl px-5 py-3 border border-black/10 bg-black text-white text-center font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                >
                  Открыть каталог
                </Link>

                <a
                  href="https://wa.me/79886033821"
                  className="rounded-2xl px-5 py-3 border border-black/10 bg-white text-black text-center font-semibold hover:bg-black/[0.02]"
                >
                  Написать в WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* sidebar */}
          <aside className="space-y-3 sm:space-y-6">
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="text-sm font-semibold text-black/80">Быстрые ссылки</div>
              <div className="mt-3 space-y-2 text-sm">
                <Link href="/catalog" className="block hover:underline text-black/80">
                  Каталог
                </Link>
                <Link href="/dostavka" className="block hover:underline text-black/80">
                  Доставка
                </Link>
                <Link href="/payment" className="block hover:underline text-black/80">
                  Оплата
                </Link>
                <Link href="/reviews" className="block hover:underline text-black/80">
                  Отзывы
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="text-sm font-semibold text-black/80">Подборка подарков</div>
              <p className="text-sm text-black/55 mt-2">
                Самые популярные форматы: клубника в шоколаде, комбо с цветами, наборы 16-25 ягод.
              </p>

              <div className="mt-4 grid gap-2">
                <Link
                  href="/catalog"
                  className="rounded-2xl px-4 py-3 border border-black/10 bg-white text-black font-semibold text-center hover:bg-black/[0.02]"
                >
                  Смотреть подборку
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
