import { Metadata } from 'next';
import { JsonLd } from 'react-schemaorg';
import type { CollectionPage } from 'schema-dts';

import AnimatedSection from '@components/AnimatedSection';
import OccasionCard    from '@components/OccasionCard';

/* ------------------------ Список поводов ------------------------ */
const occasions = [
  { slug: '8marta',        title: '8 марта',               image: '/occasions/8marta.jpg' },
  { slug: 'happybirthday', title: 'День рождения',          image: '/occasions/happybirthday.jpg' },
  { slug: 'love',          title: 'Для любимых',            image: '/occasions/love.jpg' },
  { slug: 'newyear',       title: 'Новый год',              image: '/occasions/newyear.jpg' },
  { slug: '23february',    title: '23 февраля',             image: '/occasions/23february.jpg' },
  { slug: 'valentinesday', title: '14 февраля',             image: '/occasions/valentinesday.jpg' },
  { slug: 'man',           title: 'Для мужчин',             image: '/occasions/man.jpg' },
  { slug: 'mame',          title: 'Маме',                   image: '/occasions/mame.jpg' },
  { slug: 'mothersday',    title: 'День матери',            image: '/occasions/mothersday.jpg' },
  { slug: 'graduation',    title: 'Выпускной',              image: '/occasions/graduation.jpg' },
  { slug: 'anniversary',   title: 'Годовщина',              image: '/occasions/anniversary.jpg' },
  { slug: 'family_day',    title: 'День семьи',             image: '/occasions/family_day.jpg' },
  { slug: 'child_birthday',title: 'Детский день рождения',  image: '/occasions/child_birthday.jpg' },
  { slug: 'last_bell',     title: 'Последний звонок',       image: '/occasions/last_bell.jpg' },
  { slug: 'work',          title: 'Коллегам по работе',     image: '/occasions/work.jpg' },
  { slug: '1september',    title: '1 сентября',             image: '/occasions/1september.jpg' },
];

/* --------------------------- SEO meta --------------------------- */
export const metadata: Metadata = {
  title:       'Подарки по поводам: клубника в шоколаде и букеты | KEY TO HEART',
  description: 'Выберите клубнику в шоколаде, клубничные букеты и цветы на 8 марта, День рождения, Новый год и другие поводы. Доставка по Краснодару от 60 минут.',
  keywords: [
    'клубника в шоколаде',
    'подарки по поводам',
    'клубничные букеты',
    'доставка Краснодар',
    'подарок 8 марта',
    'подарок день рождения',
  ],
  openGraph: {
    title:       'Подарки по поводам — клубника в шоколаде и букеты | KEY TO HEART',
    description: 'Идеальные сладкие и цветочные подарки с доставкой по Краснодару.',
    url:         'https://keytoheart.ru/occasions',
    images: [
      {
        url:   'https://keytoheart.ru/og-image-occasions.jpg',
        width: 1200,
        height: 630,
        alt:  'Подарки по поводам KEY TO HEART',
      },
    ],
    type: 'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Подарки по поводам | KEY TO HEART',
    description: 'Клубника в шоколаде, букеты и цветы для любого повода с доставкой 60 мин.',
    images:      ['https://keytoheart.ru/og-image-occasions.jpg'],
  },
  alternates: { canonical: 'https://keytoheart.ru/occasions' },
};

/* ----------------------------  Page  ---------------------------- */
export default function OccasionListPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* JSON‑LD CollectionPage */}
      <JsonLd<CollectionPage>
        item={{
          '@type':       'CollectionPage',
          name:          'Подарки по поводам | KEY TO HEART',
          description:   'Клубника в шоколаде, букеты и цветы для любого повода.',
          url:           'https://keytoheart.ru/occasions',
          hasPart: occasions.map((o) => ({
            '@type': 'Collection',
            name:    o.title,
            url:     `https://keytoheart.ru/occasions/${o.slug}`,
            image:   o.image,
          })),
        }}
      />

      <AnimatedSection>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-10 sm:mb-12 tracking-tight">
          Подарки по&nbsp;поводам
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
