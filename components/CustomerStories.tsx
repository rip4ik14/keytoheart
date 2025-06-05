'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import WebpImage from './WebpImage';
import { motion } from 'framer-motion';

type CustomerStory = {
  id: number;
  review: string;
  customer_name: string;
  date: string;
};

export default function CustomerStories() {
  const [stories, setStories] = useState<CustomerStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localImages = [
    '/images/rewie1.jpg',
    '/images/rewie2.jpg',
    '/images/rewie3.jpg',
    '/images/rewie1.jpg',
    '/images/rewie2.jpg',
    '/images/rewie3.jpg',
  ];

  useEffect(() => {
    // Захардкодим данные
    const hardcodedStories: CustomerStory[] = [
      {
        id: 1,
        review: 'Заказала букет из клубники в шоколаде для подруги на день рождения — она в восторге! Всё свежее, красиво упаковано, доставили вовремя. Спасибо, KeyToHeart!',
        customer_name: 'Анна',
        date: '2025-05-01',
      },
      {
        id: 2,
        review: 'Очень понравился букет! Цветы свежие, а клубника просто тает во рту. Отличный сервис, буду заказывать ещё!',
        customer_name: 'Иван',
        date: '2025-04-15',
      },
      {
        id: 3,
        review: 'Спасибо за эмоции! Заказывала подарок маме, всё сделали на высшем уровне. Доставка в срок, всё аккуратно и красиво.',
        customer_name: 'Мария',
        date: '2025-03-20',
      },
      {
        id: 4,
        review: 'Клубника в шоколаде — это что-то невероятное! Заказал для девушки, она была в восторге. Отличное качество и сервис.',
        customer_name: 'Алексей',
        date: '2025-02-14',
      },
      {
        id: 5,
        review: 'Букет был просто шикарный! Цветы и клубника выглядели идеально, доставка быстрая. Рекомендую всем!',
        customer_name: 'Екатерина',
        date: '2025-01-10',
      },
      {
        id: 6,
        review: 'Заказывала на годовщину свадьбы, всё прошло идеально. Спасибо за ваш труд и внимание к деталям!',
        customer_name: 'Ольга',
        date: '2024-12-25',
      },
    ];

    setStories(hardcodedStories.slice(0, localImages.length));
    setLoading(false);
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: localImages.length }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="w-full h-48 bg-gray-200 rounded-lg" />
            <div className="mt-2 h-4 bg-gray-200 rounded w-3/4" />
            <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  if (stories.length === 0) {
    return <p className="text-center text-gray-500">Истории клиентов пока отсутствуют</p>;
  }

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 text-black">
        Истории наших клиентов
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story, index) => {
          const imageSrc = localImages[index % localImages.length];

          return (
            <motion.div
              key={story.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-[300px] mx-auto"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={index}
            >
              <div className="relative w-full h-48">
                <WebpImage
                  src={imageSrc}
                  alt={`История от ${story.customer_name}`}
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2 line-clamp-3">{story.review}</p>
                <p className="text-sm font-semibold text-black">{story.customer_name}</p>
                <p className="text-xs text-gray-400">{new Date(story.date).toLocaleDateString('ru-RU')}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}