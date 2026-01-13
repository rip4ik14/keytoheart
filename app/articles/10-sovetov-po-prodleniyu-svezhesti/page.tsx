// app/articles/10-sovetov-po-prodleniyu-svezhesti/page.tsx
import Link from 'next/link';               // <-- импорт Link
import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { Article, WebPage } from 'schema-dts';
import ClientAnimatedSection from '@components/ClientAnimatedSection';

export const metadata: Metadata = {
  title: '10 советов по продлению свежести клубничных букетов',
  description:
    'Сохраните свежесть клубничных букетов до 24 часов: подборка проверенных лайфхаков от мастеров КЛЮЧ К СЕРДЦУ.',
  alternates: { canonical: 'https://keytoheart.ru/articles/freshness-tips' },
};

const articleSchema: Article = {
  '@type': 'Article',
  headline: '10 советов по продлению свежести клубничных букетов',
  description:
    'Узнайте, как хранить клубничные букеты от КЛЮЧ К СЕРДЦУ, чтобы они радовали свежестью до 24 часов после доставки.',
  author: { '@type': 'Organization', name: 'КЛЮЧ К СЕРДЦУ', url: 'https://keytoheart.ru' },
  publisher: {
    '@type': 'Organization',
    name: 'КЛЮЧ К СЕРДЦУ',
    logo: { '@type': 'ImageObject', url: 'https://keytoheart.ru/logo.png' },
  },
  datePublished: '2025-06-28',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://keytoheart.ru/articles/freshness-tips',
  },
};

const pageSchema: WebPage = {
  '@type': 'WebPage',
  name: '10 советов по продлению свежести клубничных букетов',
  url: 'https://keytoheart.ru/articles/freshness-tips',
  description:
    'Практические советы от КЛЮЧ К СЕРДЦУ: как ухаживать за клубничными букетами сразу после доставки и в течение 24 часов.',
};

export default function FreshnessTipsPage() {
  return (
    <main className="container mx-auto px-4 py-12 bg-white text-black min-h-screen">
      {/* JSON-LD */}
      <JsonLd<Article> item={articleSchema} />
      <JsonLd<WebPage> item={pageSchema} />

      <ClientAnimatedSection>
        <article className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-center">
            10 советов по продлению свежести клубничных букетов
          </h1>

          <p className="text-gray-700 leading-relaxed">
            Клубничные букеты — красивый и вкусный подарок. Чтобы они оставались свежими как можно дольше, следуйте этим
            простым рекомендациям от наших мастеров.
          </p>

          <ol className="list-decimal list-inside space-y-4 text-gray-700">
            <li>
              <strong>Храните в прохладе.</strong> Идеальная температура — +4…+8 °C. Не ставьте букет под прямые лучи солнца
              или рядом с обогревателями.
            </li>
            <li>
              <strong>Используйте термопакет.</strong> Если у вас есть изотермический пакет — остудите его и поместите внутрь
              при транспортировке.
            </li>
            <li>
              <strong>Избегайте влажности.</strong> Влага — враг шоколадного покрытия. Не ставьте букет во влажной среде.
            </li>
            <li>
              <strong>Не трясите букет.</strong> Берегите ягоды от механических повреждений — держите за упаковку, не сжимайте.
            </li>
            <li>
              <strong>Проветрите перед хранением.</strong> Дайте воздуху циркулировать 5–10 минут перед тем как поставить в
              холодильник.
            </li>
            <li>
              <strong>Упакуйте в пергамент.</strong> Нежный пергамент защитит шоколад и ягоды от конденсата.
            </li>
            <li>
              <strong>Не сбрызгивайте водой.</strong> Клубника впитывает влагу — вкус и структура могут испортиться.
            </li>
            <li>
              <strong>Добавьте сухой лед для длительной перевозки.</strong> Если доставка занимает больше часа, сухой лед
              сохранит прохладу.
            </li>
            <li>
              <strong>Подавайте сразу перед вручением.</strong> За 10 минут до вручения достаньте из холодильника, чтобы
              шоколад слегка «ожил» и раскрыл аромат.
            </li>
            <li>
              <strong>Сохраняйте в оригинальной упаковке.</strong> Не распаковывайте букет заранее — упаковка создана нами
              для идеального микроклимата.
            </li>
          </ol>

          <p className="text-gray-700">
            Следуя этим советам, вы подарите незабываемые эмоции и сохраните красоту букетов КЛЮЧ К СЕРДЦУ на весь день! Чтобы
            вернуться в каталог, кликните{' '}
            <Link href="/catalog" className="text-pink-600 underline">
              здесь
            </Link>
            .
          </p>
        </article>
      </ClientAnimatedSection>
    </main>
  );
}
