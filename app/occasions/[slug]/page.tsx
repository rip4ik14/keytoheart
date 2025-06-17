import { notFound } from "next/navigation";
import { Metadata } from 'next';
import Image from "next/image";
import { prisma } from '@/lib/prisma';
import { JsonLd } from 'react-schemaorg';
import type { ItemList } from 'schema-dts'; // Исправляем на ItemList
import AnimatedSection from '@components/AnimatedSection';
import ProductCard from '@components/ProductCard';
import BackToOccasionsButton from '@components/BackToOccasionsButton';

// Список поводов
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

// Генерация метаданных для динамических страниц
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const occasion = occasions.find((o) => o.slug === params.slug);
  if (!occasion) {
    return {
      title: 'Повод не найден | KEY TO HEART',
      description: 'Такого повода не существует. Выберите другой повод для подарка.',
    };
  }

  return {
    title: `${occasion.title} | KEY TO HEART`,
    description: `Подарки на ${occasion.title} от KEY TO HEART. Клубничные букеты и наборы с доставкой по Краснодару.`,
    keywords: [occasion.title, 'KEY TO HEART', 'Краснодар', 'клубничные букеты', 'доставка'],
    openGraph: {
      title: `${occasion.title} | KEY TO HEART`,
      description: `Подарки на ${occasion.title} с доставкой по Краснодару.`,
      url: `https://keytoheart.ru/occasions/${occasion.slug}`,
      images: [
        {
          url: occasion.image,
          width: 1200,
          height: 630,
          alt: occasion.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${occasion.title} | KEY TO HEART`,
      description: `Подарки на ${occasion.title} с доставкой по Краснодару.`,
      images: [occasion.image],
    },
    alternates: { canonical: `https://keytoheart.ru/occasions/${occasion.slug}` },
  };
}

// Компонент скелетона для загрузки продуктов
const ProductSkeleton = () => (
  <div className="animate-pulse">
    <div className="relative aspect-[4/5] rounded-xl bg-gray-200"></div>
    <div className="mt-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
    </div>
  </div>
);

export default async function OccasionDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const occasion = occasions.find((o) => o.slug === params.slug);
  if (!occasion) {
    notFound();
  }

  const data = await prisma.products.findMany({
    where: { occasion_slug: params.slug, in_stock: true },
    select: {
      id: true,
      title: true,
      price: true,
      discount_percent: true,
      original_price: true,
      in_stock: true,
      images: true,
      image_url: true,
      created_at: true,
      slug: true,
      bonus: true,
      short_desc: true,
      description: true,
      composition: true,
      is_popular: true,
      is_visible: true,
      production_time: true,
      order_index: true,
    },
  });

  const products = data.map((product: any) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    discount_percent: product.discount_percent ?? null,
    original_price:
      product.original_price !== null && typeof product.original_price === 'object' && 'toNumber' in product.original_price
        ? product.original_price.toNumber()
        : product.original_price !== null
          ? Number(product.original_price)
          : null,
    in_stock: product.in_stock ?? true,
    images: Array.isArray(product.images) ? product.images : [],
    image_url: product.image_url ?? null,
    created_at: product.created_at ?? null,
    slug: product.slug ?? null,
    bonus: product.bonus ? Number(product.bonus) : null,
    short_desc: product.short_desc ?? null,
    description: product.description ?? null,
    composition: product.composition ?? null,
    is_popular: product.is_popular ?? false,
    is_visible: product.is_visible ?? true,
    category_ids: [],
    production_time: product.production_time ?? null,
    order_index: product.order_index ?? null,
  }));

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <JsonLd<ItemList>
        item={{
          '@type': 'ItemList', // Используем ItemList вместо CollectionPage
          name: `${occasion.title} | KEY TO HEART`,
          description: `Подарки на ${occasion.title} от KEY TO HEART.`,
          url: `https://keytoheart.ru/occasions/${occasion.slug}`,
          image: occasion.image,
          itemListElement: products?.map((product) => ({
            '@type': 'ListItem',
            position: products.indexOf(product) + 1,
            item: {
              '@type': 'Product',
              name: product.title,
              url: `https://keytoheart.ru/product/${product.id}`,
              image: product.images?.[0] || "/no-image.png",
              offers: {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: 'RUB',
                availability: 'https://schema.org/InStock',
              },
            },
          })) || [],
        }}
      />

      <AnimatedSection>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12 tracking-tight">
          {occasion.title}
        </h1>
      </AnimatedSection>

      <AnimatedSection>
        <div className="relative w-full max-w-2xl mx-auto aspect-[4/3] rounded-xl overflow-hidden shadow-lg mb-10 sm:mb-12">
          <Image
            src={occasion.image}
            alt={occasion.title}
            fill
            className="object-cover"
          />
        </div>
      </AnimatedSection>

      {products ? (
        products.length > 0 ? (
          <AnimatedSection>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product, idx) => (
                <ProductCard key={product.id} product={product} priority={idx < 2} />
              ))}
            </div>
          </AnimatedSection>
        ) : (
          <AnimatedSection>
            <div className="text-center text-gray-500 mt-10 sm:mt-12">
              <p className="text-base sm:text-lg mb-4">
                Пока нет товаров для этого повода.
              </p>
              <BackToOccasionsButton occasionTitle={occasion.title} />
            </div>
          </AnimatedSection>
        )
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}