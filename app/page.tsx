/* -------------------------------------------------------------------------- */
/*  Главная страница (SEO boost + Edge runtime + FAQ)                         */
/* -------------------------------------------------------------------------- */

import React from 'react';
import type { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { ItemList, FAQPage, WebPage, BreadcrumbList, Organization } from 'schema-dts';

import PromoGridServer from '@components/PromoGridServer';
import CategoryPreviewServer from '@components/CategoryPreviewServer';
import SkeletonCard from '@components/ProductCardSkeleton';
import AdvantagesClient from '@components/AdvantagesClient';
import YandexReviewsWidget from '@components/YandexReviewsWidget';
import FAQSectionWrapper from '@components/FAQSectionWrapper';
import FlowwowReviewsWidget from '@components/FlowwowReviewsWidget';
import GiftIdeasStrip from '@components/GiftIdeasStrip';

import { getHomeData } from '@/lib/data/home';

/* ----------------------------- FAQ (единый источник) ----------------------------- */
const faqList = [
  {
    question: 'Какую клубнику вы используете в букетах и наборах?',
    answer:
      'Мы используем свежую местную и импортную ягоду в зависимости от сезона - вкус остаётся на высоте в любое время года. Каждая ягода проходит тщательный ручной отбор - в букеты попадает только идеальная клубника.',
  },
  {
    question: 'Какой шоколад вы используете?',
    answer:
      'Только премиальный бельгийский шоколад Callebaut: молочный, белый без привкуса какао и тёмный с ярким вкусом какао. Никаких заменителей и глазури.',
  },
  {
    question: 'Как работает программа лояльности?',
    answer:
      'За каждый заказ вы получаете от 2,5 % до 15 % бонусами. 1 балл = 1 ₽, их можно использовать при следующих покупках. Дарим 1000 баллов за первый заказ.',
  },
  {
    question: 'Можно ли оформить заказ в день покупки?',
    answer:
      'Да, мы доставим ваш заказ от 30 минут - чтобы порадовать вас и ваших близких без ожидания.',
  },
];

const faqEntities: FAQPage['mainEntity'] = faqList.map((f) => ({
  '@type': 'Question',
  name: f.question,
  acceptedAnswer: { '@type': 'Answer', text: f.answer },
}));

/* -------------------------- ISR / Edge flags ---------------------------- */
export const revalidate = 300;

/* --------------------------- Метаданные -------------------------------- */
export const metadata: Metadata = {
  title: 'Клубника в шоколаде, цветы и комбо-наборы с доставкой в Краснодаре',
  description:
    'Клубника в шоколаде, клубничные букеты, цветы и комбо-наборы с доставкой по Краснодару и до 20 км за 30 минут. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой, бесплатная открытка и удобная оплата онлайн.',
  openGraph: {
    title: 'КЛЮЧ К СЕРДЦУ - клубника в шоколаде, цветы и комбо-наборы',
    description:
      'Закажите клубнику в шоколаде, цветы и комбо-наборы с доставкой 30 мин по Краснодару и до 20 км. Фото перед отправкой, бесплатная открытка, оплата онлайн.',
    url: 'https://keytoheart.ru',
    images: [
      {
        url: 'https://keytoheart.ru/og-cover.webp',
        width: 1200,
        height: 630,
        alt: 'Клубника в шоколаде - КЛЮЧ К СЕРДЦУ',
      },
      {
        url: 'https://keytoheart.ru/og-bouquet.webp',
        width: 1200,
        height: 630,
        alt: 'Клубничный букет - КЛЮЧ К СЕРДЦУ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'КЛЮЧ К СЕРДЦУ - клубника в шоколаде и цветы в Краснодаре',
    description:
      'Свежая клубника в шоколаде, букеты и цветы с доставкой за 30 мин по Краснодару. Бесплатная открытка в подарок, оплата онлайн.',
    images: ['https://keytoheart.ru/og-cover.webp'],
  },
  alternates: { canonical: 'https://keytoheart.ru' },
};

/* ---------------------- JSON-LD генератор ---------------------- */
function buildLdGraph(
  products: any[],
): Array<WebPage | BreadcrumbList | ItemList | FAQPage | Organization> {
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const itemList: ItemList = {
    '@type': 'ItemList',
    itemListOrder: 'http://schema.org/ItemListOrderAscending',
    itemListElement: products.slice(0, 12).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.title,
        url: `https://keytoheart.ru/product/${p.id}`,
        image: p.images[0],
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: 'RUB',
          priceValidUntil: validUntil.toISOString().split('T')[0],
          availability: p.in_stock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      },
    })),
  };

  const webPage: WebPage = {
    '@id': 'https://keytoheart.ru/#home',
    '@type': 'WebPage',
    name: 'КЛЮЧ К СЕРДЦУ - клубника в шоколаде, цветы и комбо-наборы с доставкой в Краснодаре',
    url: 'https://keytoheart.ru',
    description:
      'Клубника в шоколаде, клубничные букеты, цветы и комбо-наборы с доставкой по Краснодару и до 20 км за 30 минут. Свежие ягоды, бельгийский шоколад, фото заказа перед отправкой, бесплатная открытка и удобная оплата онлайн.',
    inLanguage: 'ru',
  };

  const breadcrumbs: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: 'https://keytoheart.ru',
      },
    ],
  };

  const faqPage: FAQPage = {
    '@type': 'FAQPage',
    mainEntity: faqEntities,
  };

  const org: Organization = {
    '@type': 'Organization',
    name: 'КЛЮЧ К СЕРДЦУ',
    url: 'https://keytoheart.ru',
    sameAs: ['https://flowwow.com/shop/key-to-heart/'],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.93,
      bestRating: 5,
      worstRating: 1,
      ratingCount: 2800,
    },
  };

  return [webPage, breadcrumbs, itemList, faqPage, org];
}

/* ==============================  Страница  ============================== */
export default async function Home() {
  const { products, categoriesMeta, giftIdeas } = await getHomeData();

  const ldGraph = buildLdGraph(products);

  // ✅ Готовим превью категорий без повторов товаров между секциями
  // Один товар может состоять в нескольких категориях, но на главной покажется только в первой подходящей секции
  const usedProductIds = new Set<number>();

  const categoryPreviewBlocks = categoriesMeta.slice(0, 4).map((catMeta, idx) => {
    const { id: catId, name: catName, slug } = catMeta;

    // Кандидаты по категории
    const candidates = products.filter((p) => p.category_ids.includes(catId));

    // Защита от дублей внутри одной категории + нормализация id
    const seenInsideCategory = new Set<number>();

    const uniqueItemsForThisCategory: typeof products = [];
    for (const product of candidates) {
      const productId = Number(product.id);
      if (!Number.isFinite(productId)) continue;

      // дубль внутри этой же категории
      if (seenInsideCategory.has(productId)) continue;
      seenInsideCategory.add(productId);

      // уже показан в предыдущей секции
      if (usedProductIds.has(productId)) continue;

      usedProductIds.add(productId);
      uniqueItemsForThisCategory.push(product);

      if (uniqueItemsForThisCategory.length >= 8) break;
    }

    if (uniqueItemsForThisCategory.length === 0) return null;

    const headingId = `category-preview-${slug || idx}`;

    return (
      <React.Fragment key={catId}>
        <CategoryPreviewServer
          categoryName={catName}
          products={uniqueItemsForThisCategory}
          seeMoreLink={slug}
          headingId={headingId}
        />
        {idx === 0 && <AdvantagesClient />}
      </React.Fragment>
    );
  });

  return (
    <main aria-label="Главная страница">
      <JsonLd<{ '@graph': unknown[] }> item={{ '@graph': ldGraph }} />

      <h1 className="sr-only sm:not-sr-only text-sm sm:mt-3 sm:mb-2 sm:text-white">
        Клубника в шоколаде, букеты и комбо-наборы с доставкой в Краснодаре
      </h1>

      <section role="region" aria-label="Промо-баннер">
        <PromoGridServer />
      </section>

      {/* ✅ Ищу подарок (ТОЛЬКО мобилка, категория "povod") */}
      {giftIdeas.length > 0 && (
        <div className="block lg:hidden">
          <GiftIdeasStrip title="Ищу подарок" items={giftIdeas} seeAllHref="/category/povod" />
        </div>
      )}

      <section role="region" aria-label="Категории товаров" id="home-categories">
        <h2 className="sr-only">Категории товаров</h2>

        {products.length === 0 ? (
          <div className="mx-auto my-12 grid max-w-7xl grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          categoryPreviewBlocks
        )}
      </section>

      {/* Flowwow (как на Labberry, без картинок) */}
      <section
        role="region"
        aria-label="Отзывы Flowwow"
        className="mt-8 sm:mt-10"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '500px' }}
      >
        <h2 className="sr-only">Отзывы на Flowwow</h2>
        <FlowwowReviewsWidget className="" />
      </section>

      {/* Яндекс отзывы */}
      <section
        role="region"
        aria-label="Отзывы клиентов"
        className="mt-8 sm:mt-10"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '700px' }}
      >
        <h2 className="sr-only">Отзывы клиентов</h2>
        <YandexReviewsWidget />
      </section>

      <section
        role="region"
        aria-label="Вопросы и ответы"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '600px' }}
      >
        <h2 className="sr-only">Вопросы и ответы</h2>
        <FAQSectionWrapper />
      </section>
    </main>
  );
}