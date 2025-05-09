'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { supabasePublic as supabase } from '@/lib/supabase/public';

// Функция для проверки валидности URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

type CustomerStory = {
  id: number;
  photo_url: string;
  review: string;
  customer_name: string;
  date: string;
};

export default function CustomerStories() {
  const [stories, setStories] = useState<CustomerStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем истории клиентов
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('customer_stories')
          .select('id, photo_url, review, customer_name, date')
          .eq('is_visible', true)
          .order('date', { ascending: false })
          .limit(6);

        if (error) {
          throw new Error(`Ошибка загрузки историй: ${error.message}`);
        }

        setStories(data || []);
      } catch (err: any) {
        console.error('Ошибка загрузки историй клиентов:', err);
        setError(err.message.includes('relation "public.customer_stories" does not exist')
          ? 'Таблица историй клиентов не найдена. Пожалуйста, обратитесь к администратору.'
          : 'Не удалось загрузить истории клиентов. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  // Анимации для карточек
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
        {Array.from({ length: 6 }).map((_, i) => (
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
          // Проверяем валидность URL и подставляем запасной, если нужно
          const imageSrc = story.photo_url && isValidUrl(story.photo_url)
            ? story.photo_url
            : 'https://via.placeholder.com/150';

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
                <Image
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