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

/* -------------------------------------------------------------------------- */
/*  Occasion Detail – v4                                                      */
/* -------------------------------------------------------------------------- */

const occasions = [
  { slug: '8marta',        title: '8 марта',       image: '/occasions/8marta.jpg' },
  { slug: 'happybirthday', title: 'День рождения', image: '/occasions/happybirthday.jpg' },
  { slug: 'love',          title: 'Для любимых',   image: '/occasions/love.jpg' },
  { slug: '1september',    title: '1 сентября',    image: '/occasions/1september.jpg' },
  // …остальные
] as const;
type Occasion = (typeof occasions)[number];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/* ----------------------- metadata ----------------------- */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const occasion = occasions.find(o => o.slug === params.slug);
  if (!occasion) return { title: 'Повод не найден', robots: { index: false, follow: false } };

  const desc =
    `Подарки на ${occasion.title}: клубничные букеты, цветы и комбо‑наборы. ` +
    'Доставка 60 мин, фото перед отправкой, открытка бесплатно, оплата онлайн.';

  return {
    title: `${occasion.title} | KEY TO HEART`,
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

  /* основная выборка */
  const { data: byOccasion }: { data: any[] | null } = await supabase
    .from('products')
    .select('*')
    .eq('occasion_slug', params.slug)
    .eq('in_stock', true);

  let products: any[] = byOccasion ?? [];   // ← всегда массив
  let isFallback = false;

  /* если нет товаров — 8 случайных */
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

  /* JSON‑LD */
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
          <Image src={occasion.image} alt={occasion.title} fill priority className="object-cover" sizes="(max-width: 600px) 100vw, 600px" quality={70} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
          <h1 className="absolute inset-x-0 bottom-6 text-center text-3xl sm:text-5xl font-bold text-white drop-shadow">
            {occasion.title}
          </h1>
        </div>
      </AnimatedSection>

      {/* INTRO */}
      <AnimatedSection>
        <section className="mx-auto mt-12 grid max-w-4xl grid-cols-1 sm:grid-cols-2 gap-8 items-center">
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
            Ищете подарок на {occasion.title.toLowerCase()}? Клубничные букеты, цветы и комбо‑наборы —
            доставка 60 минут, фото перед отправкой, открытка бесплатно.
          </p>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src={occasion.image} alt={occasion.title} fill className="object-cover" sizes="(max-width: 600px) 100vw, 600px" quality={70} />
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

            {/* CTA показать ещё */}
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
