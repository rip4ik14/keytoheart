import { notFound } from "next/navigation";
import { Metadata } from 'next';
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
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
      title: 'Повод не найден | KeyToHeart',
      description: 'Такого повода не существует. Выберите другой повод для подарка.',
    };
  }

  return {
    title: `${occasion.title} | KeyToHeart`,
    description: `Подарки на ${occasion.title} от KeyToHeart. Клубничные букеты и наборы с доставкой по Краснодару.`,
    keywords: [occasion.title, 'KeyToHeart', 'Краснодар', 'клубничные букеты', 'доставка'],
    openGraph: {
      title: `${occasion.title} | KeyToHeart`,
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
      title: `${occasion.title} | KeyToHeart`,
      description: `Подарки на ${occasion.title} с доставкой по Краснодару.`,
      images: [occasion.image],
    },
    alternates: { canonical: `https://keytoheart.ru/occasions/${occasion.slug}` },
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  let products = null;
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("occasion_slug", params.slug)
      .eq("in_stock", true);

    if (error) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки продуктов:', error.message || error);
      throw new Error('Ошибка загрузки продуктов из Supabase');
    }

    products = data;
  } catch (err) {
    process.env.NODE_ENV !== "production" && console.error('Не удалось загрузить продукты:', err);
    products = [];
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <JsonLd<ItemList>
        item={{
          '@type': 'ItemList', // Используем ItemList вместо CollectionPage
          name: `${occasion.title} | KeyToHeart`,
          description: `Подарки на ${occasion.title} от KeyToHeart.`,
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
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
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