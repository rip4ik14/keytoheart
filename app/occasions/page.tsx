import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { CollectionPage } from 'schema-dts'; // Исправляем импорт
import AnimatedSection from '@components/AnimatedSection';
import OccasionCard from '@components/OccasionCard';

const occasions = [
  {
    slug: "8marta",
    title: "8 марта",
    image: "/occasions/8marta.jpg",
  },
  {
    slug: "happybirthday",
    title: "День рождения",
    image: "/occasions/happybirthday.jpg",
  },
  {
    slug: "love",
    title: "Для любимых",
    image: "/occasions/love.jpg",
  },
  {
    slug: "newyear",
    title: "Новый год",
    image: "/occasions/newyear.jpg",
  },
  {
    slug: "23february",
    title: "23 февраля",
    image: "/occasions/23february.jpg",
  },
  {
    slug: "valentinesday",
    title: "14 февраля",
    image: "/occasions/valentinesday.jpg",
  },
  {
    slug: "man",
    title: "Для мужчин",
    image: "/occasions/man.jpg",
  },
  {
    slug: "mame",
    title: "Маме",
    image: "/occasions/mame.jpg",
  },
  {
    slug: "mothersday",
    title: "День матери",
    image: "/occasions/mothersday.jpg",
  },
  {
    slug: "graduation",
    title: "Выпускной",
    image: "/occasions/graduation.jpg",
  },
  {
    slug: "anniversary",
    title: "Годовщина",
    image: "/occasions/anniversary.jpg",
  },
  {
    slug: "family_day",
    title: "День семьи",
    image: "/occasions/family_day.jpg",
  },
  {
    slug: "child_birthday",
    title: "Детский день рождения",
    image: "/occasions/child_birthday.jpg",
  },
  {
    slug: "last_bell",
    title: "Последний звонок",
    image: "/occasions/last_bell.jpg",
  },
  {
    slug: "work",
    title: "Коллегам по работе",
    image: "/occasions/work.jpg",
  },
  {
    slug: "1september",
    title: "1 сентября",
    image: "/occasions/1september.jpg",
  },
];

export const metadata: Metadata = {
  title: 'Подарки по поводам | KeyToHeart',
  description: 'Выберите идеальный подарок для любого повода: 8 марта, День рождения, День влюблённых, Новый год и другие. Доставка по Краснодару.',
  keywords: ['подарки по поводам', 'KeyToHeart', 'Краснодар', 'клубничные букеты', 'доставка'],
  openGraph: {
    title: 'Подарки по поводам | KeyToHeart',
    description: 'Идеальные подарки для любого повода с доставкой по Краснодару.',
    url: 'https://keytoheart.ru/occasions',
    images: [
      {
        url: 'https://keytoheart.ru/og-image-occasions.jpg',
        width: 1200,
        height: 630,
        alt: 'Подарки по поводам KeyToHeart',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Подарки по поводам | KeyToHeart',
    description: 'Идеальные подарки для любого повода с доставкой по Краснодару.',
    images: ['https://keytoheart.ru/og-image-occasions.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/occasions' },
};

export default function OccasionListPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"> {/* Исправляем anh на className */}
      <JsonLd<CollectionPage>
        item={{
          '@type': 'CollectionPage',
          name: 'Подарки по поводам | KeyToHeart',
          description: 'Выберите идеальный подарок для любого повoda: 8 марта, День рождения, День влюблённых, Новый год и другие.',
          url: 'https://keytoheart.ru/occasions',
          hasPart: occasions.map((o) => ({
            '@type': 'Collection',
            name: o.title,
            url: `https://keytoheart.ru/occasions/${o.slug}`,
            image: o.image,
          })),
        }}
      />

      <AnimatedSection>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-10 sm:mb-12 tracking-tight">
          Подарки по поводам
        </h1>
      </AnimatedSection>

      <AnimatedSection>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {occasions.map((o, index) => (
            <OccasionCard key={o.slug} occasion={o} index={index} />
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
}