// app/occasions/[slug]/page.tsx

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { JsonLd } from 'react-schemaorg';
import type { ItemList } from 'schema-dts';

import AnimatedSection from '@/components/AnimatedSection';
import ProductCard from '@/components/ProductCard';
import BackToOccasionsButton from '@/components/BackToOccasionsButton';

/* ------------------------- Поводы ------------------------- */
const occasions = [
  { slug: '8marta',         title: '8 марта',                  image: '/occasions/8marta.jpg' },
  { slug: 'happybirthday',  title: 'День рождения',            image: '/occasions/happybirthday.jpg' },
  { slug: 'love',           title: 'Для любимых',              image: '/occasions/love.jpg' },
  { slug: 'newyear',        title: 'Новый год',                image: '/occasions/newyear.jpg' },
  { slug: '23february',     title: '23 февраля',               image: '/occasions/23february.jpg' },
  { slug: 'valentinesday',  title: '14 февраля',               image: '/occasions/valentinesday.jpg' },
  { slug: 'man',            title: 'Для мужчин',               image: '/occasions/man.jpg' },
  { slug: 'mame',           title: 'Маме',                     image: '/occasions/mame.jpg' },
  { slug: 'mothersday',     title: 'День матери',              image: '/occasions/mothersday.jpg' },
  { slug: 'graduation',     title: 'Выпускной',                image: '/occasions/graduation.jpg' },
  { slug: 'anniversary',    title: 'Годовщина',                image: '/occasions/anniversary.jpg' },
  { slug: 'family_day',     title: 'День семьи',               image: '/occasions/family_day.jpg' },
  { slug: 'child_birthday', title: 'Детский день рождения',    image: '/occasions/child_birthday.jpg' },
  { slug: 'last_bell',      title: 'Последний звонок',         image: '/occasions/last_bell.jpg' },
  { slug: 'work',           title: 'Коллегам по работе',       image: '/occasions/work.jpg' },
  { slug: '1september',     title: '1 сентября',               image: '/occasions/1september.jpg' },
] as const;
type Occasion = (typeof occasions)[number];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/* --------------------- SEO‑абзацы для каждого повода --------------------- */
const occasionSeoText: Record<string, string> = {
  '8marta': `Подарите незабываемые эмоции женщинам на 8 марта! Клубничные букеты, изысканные цветы и оригинальные наборы для поздравления мамы, жены или коллеги. Бесплатная открытка к каждому заказу, доставка за 60 минут по Краснодару. <a href='/category/flowers' class='underline hover:text-black'>Свежие букеты</a> и <a href='/category/combo' class='underline hover:text-black'>комбо-наборы</a>.`,
  happybirthday: `Лучшие подарки ко дню рождения — клубника в шоколаде, оригинальные букеты и сладкие наборы. Удивите именинника быстрой доставкой и красивым оформлением! <a href='/category/klubnichnye-bukety' class='underline hover:text-black'>Клубничные букеты</a> на любой вкус и возраст.`,
  love: `Подарите любовь в каждой детали! Романтические букеты, клубника в шоколаде и эксклюзивные сладкие композиции для любимых. Доставка по Краснодару за 60 минут. <a href='/category/klubnichnye-bukety' class='underline hover:text-black'>Букеты для двоих</a> и <a href='/category/combo' class='underline hover:text-black'>подарочные наборы</a>.`,
  newyear: `В Новый год дарите не только радость, но и вкус! Клубника в шоколаде, подарочные боксы и цветы для праздничного стола или как знак внимания коллегам и близким. <a href='/category/podarki' class='underline hover:text-black'>Подарки и сладкие букеты</a>.`,
  '23february': `Подарите мужчинам внимание и вкус на 23 февраля! Оригинальные сладкие наборы, клубника в шоколаде, брутальные букеты. Закажите доставку за 60 минут по Краснодару. <a href='/category/man' class='underline hover:text-black'>Подарки для мужчин</a>.`,
  valentinesday: `14 февраля — идеальный повод для романтики! Клубника в шоколаде, букеты и комбо-наборы для любимых. Быстрая доставка, открытка в подарок. <a href='/category/love' class='underline hover:text-black'>Романтические букеты</a>.`,
  man: `Оригинальные подарки для мужчин: клубника в шоколаде, брутальные букеты, сладкие наборы с доставкой по Краснодару. <a href='/category/podarki' class='underline hover:text-black'>Все подарки</a>.`,
  mame: `Поздравьте маму с особым событием — клубничные букеты, цветы и сладкие наборы. В каждой композиции — забота и внимание. <a href='/category/flowers' class='underline hover:text-black'>Букеты для мамы</a>.`,
  mothersday: `День матери — отличный повод порадовать заботой и вкусом! Свежие букеты, клубника в шоколаде, открытка бесплатно. <a href='/category/flowers' class='underline hover:text-black'>Букеты для мамы</a>.`,
  graduation: `Выпускной запомнится надолго с красивым и вкусным подарком! Клубника в шоколаде, цветочные букеты и подарочные боксы для выпускников и учителей. <a href='/category/klubnichnye-bukety' class='underline hover:text-black'>Сладкие букеты</a>.`,
  anniversary: `Годовщина — время подарить эмоции! Клубника в шоколаде, цветы и эксклюзивные наборы для влюблённых и семейных пар. <a href='/category/love' class='underline hover:text-black'>Романтика</a>.`,
  family_day: `Семейный праздник с доставкой счастья: клубника в шоколаде, букеты и сладкие наборы для всех возрастов. <a href='/category/combo' class='underline hover:text-black'>Комбо для семьи</a>.`,
  child_birthday: `Детский день рождения — праздник ярких вкусов! Сладкие букеты, клубника в шоколаде, оригинальные подарки. <a href='/category/klubnichnye-boksy' class='underline hover:text-black'>Сладкие боксы</a>.`,
  last_bell: `Последний звонок — отличный повод для необычного подарка учителю или выпускнику. Клубника в шоколаде и цветочные композиции с доставкой. <a href='/category/flowers' class='underline hover:text-black'>Букеты учителю</a>.`,
  work: `Коллегам по работе: необычные подарки и сладкие букеты для корпоративных праздников и событий. Быстрая доставка по Краснодару. <a href='/category/podarki' class='underline hover:text-black'>Подарки для коллег</a>.`,
  '1september': `1 сентября — новый учебный год, новые эмоции! Сладкие букеты, клубника в шоколаде, подарки для учителей и школьников. <a href='/category/klubnichnye-bukety' class='underline hover:text-black'>Подарки учителю</a>.`,
};

/* ----------------------- metadata ----------------------- */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const occasion = occasions.find(o => o.slug === params.slug);
  if (!occasion) return { title: 'Повод не найден', robots: { index: false, follow: false } };

  const desc =
    `Подарки на ${occasion.title}: клубничные букеты, цветы и комбо‑наборы. ` +
    'Доставка 60 мин, фото перед отправкой, открытка бесплатно, оплата онлайн.';

  return {
    title: occasion.title,
    description: desc,
    alternates: { canonical: `https://keytoheart.ru/occasions/${occasion.slug}` },
    openGraph: {
      title: `${occasion.title} | KEY TO HEART`,
      description: desc,
      url: `https://keytoheart.ru/occasions/${occasion.slug}`,
      images: [{ url: occasion.image, width: 1200, height: 630, alt: occasion.title }],
    },
    twitter: { card: 'summary_large_image', title: occasion.title, description: desc, images: [occasion.image] },
  };
}

/* ----------------------- skeleton ----------------------- */
const ProductSkeleton = () => (
  <div className="flex flex-col gap-2 animate-pulse">
    <div className="aspect-[4/5] w-full rounded-2xl bg-gray-200" />
    <div className="h-3 w-3/4 rounded bg-gray-200" />
    <div className="h-3 w-1/2 rounded bg-gray-200" />
  </div>
);

/* ------------------------- page ------------------------- */
export default async function OccasionPage({ params }: { params: { slug: string } }) {
  const occasion = occasions.find(o => o.slug === params.slug) as Occasion | undefined;
  if (!occasion) notFound();

  // Основная выборка
  const { data: byOccasion }: { data: any[] | null } = await supabase
    .from('products')
    .select('*')
    .eq('occasion_slug', params.slug)
    .eq('in_stock', true);

  let products: any[] = byOccasion ?? [];
  let isFallback = false;

  // Fallback — если товаров нет, 8 случайных
  if (products.length === 0) {
    const { data: random }: { data: any[] | null } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .order('id', { ascending: false })
      .limit(8);
    products = random ?? [];
    isFallback = true;
  }

  // JSON‑LD
  const ld: ItemList = {
    '@type': 'ItemList',
    name: `${occasion.title} | KEY TO HEART`,
    url: `https://keytoheart.ru/occasions/${occasion.slug}`,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.title,
        url: `https://keytoheart.ru/product/${p.id}`,
        image: p.images?.[0] ?? '/no-image.png',
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: 'RUB',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <JsonLd<ItemList> item={ld} />

      {/* HERO */}
      <AnimatedSection>
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl shadow-lg">
          <Image src={occasion.image} alt={occasion.title} fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
          <h1 className="absolute inset-x-0 bottom-6 text-center text-3xl sm:text-5xl font-bold text-white drop-shadow">
            {occasion.title}
          </h1>
        </div>
      </AnimatedSection>

      {/* SEO‑текст */}
      <AnimatedSection>
        <section className="mx-auto mt-12 grid max-w-4xl grid-cols-1 sm:grid-cols-2 gap-8 items-center">
          <div>
            <p
              className="text-gray-700 text-base sm:text-lg leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: occasionSeoText[params.slug] ||
                  `В нашем магазине — только свежая клубника в шоколаде, оригинальные букеты и подарочные наборы с быстрой доставкой по Краснодару.`
              }}
            />
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src={occasion.image} alt={occasion.title} fill className="object-cover" />
          </div>
        </section>
      </AnimatedSection>

      {/* PRODUCTS */}
      <AnimatedSection>
        {products.length ? (
          <>
            <h2 className="mt-16 mb-6 text-center text-2xl sm:text-3xl font-semibold tracking-tight">
              {isFallback ? 'Популярные товары' : 'Подборка подарков'}
            </h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:gap-8">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="/catalog"
                className="border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center bg-white text-[#535353] transition-all duration-200 shadow-sm hover:bg-[#535353] hover:text-white active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd]"
              >
                Показать ещё
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-16 flex flex-col items-center gap-6">
            <p className="text-gray-500 text-base sm:text-lg">
              К сожалению, пока нет товаров для этого повода.
            </p>
            <BackToOccasionsButton occasionTitle={occasion.title} />
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:gap-8 w-full max-w-4xl mt-6">
              {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          </div>
        )}
      </AnimatedSection>
    </div>
  );
}
