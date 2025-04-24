// components/PromoGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

interface PromoBlock {
  id: number;
  title: string;
  subtitle?: string;
  href: string;
  image_url: string;
  type: 'card' | 'banner';
  button_text?: string;
}

export default function PromoGrid() {
  const [cards, setCards] = useState<PromoBlock[]>([]);
  const [banners, setBanners] = useState<PromoBlock[]>([]);

  useEffect(() => {
    async function fetchBlocks() {
      const { data, error } = await supabase
        .from('promo_blocks')
        .select('*')
        .order('order_index');

      if (!data || error) {
        console.error('Ошибка загрузки промоблоков:', error?.message);
        return;
      }

      setCards(data.filter((b) => b.type === 'card'));
      setBanners(data.filter((b) => b.type === 'banner'));
    }

    fetchBlocks();
  }, []);

  return (
    <motion.section
      className="container mx-auto mt-10 px-4"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Слайдер баннеров */}
        <motion.div
          className="relative col-span-1 lg:col-span-2 h-[300px] sm:h-[400px] md:h-[500px] rounded-3xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 5000 }}
            pagination={{ clickable: true }}
            loop
            className="w-full h-full"
          >
            {banners.map((banner, i) => (
              <SwiperSlide key={banner.id}>
                <Link href={banner.href || '#'} className="block w-full h-full relative">
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority={i === 0}
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex justify-end flex-col px-6 md:px-16 py-8 md:py-12 text-white">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="max-w-xl"
                    >
                      <h2 title={banner.title} className="text-white text-3xl md:text-4xl font-extrabold mb-3 line-clamp-2">
                        {banner.title}
                      </h2>
                      {banner.subtitle && (
                        <p title={banner.subtitle} className="text-white text-base md:text-lg mb-4 line-clamp-2">
                          {banner.subtitle}
                        </p>
                      )}
                      <span className="inline-block border border-white text-white font-medium px-6 py-2 rounded-full text-sm md:text-base transition shadow-md hover:shadow-lg">
                        {banner.button_text || 'Подробнее'}
                      </span>
                    </motion.div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

        {/* Карточки (desktop) */}
        <motion.div
          className="hidden lg:grid grid-cols-2 grid-rows-2 gap-4 h-[500px]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {cards.slice(0, 4).map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="relative rounded-3xl overflow-hidden group w-full h-full"
            >
              <Image
                src={card.image_url}
                alt={card.title}
                fill
                sizes="50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all"></div>
              <span title={card.title} className="absolute bottom-2 left-2 bg-white text-black text-sm font-medium rounded-full px-3 py-1 max-w-[90%] truncate z-10 shadow-md">
                {card.title}
              </span>
            </Link>
          ))}
        </motion.div>

        {/* Карточки (мобильный слайдер) */}
        <motion.div
          className="block lg:hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Swiper spaceBetween={12} slidesPerView={1.2} className="mt-4 pb-6">
            {cards.map((card) => (
              <SwiperSlide key={card.id}>
                <Link
                  href={card.href}
                  className="relative aspect-[3/2] rounded-3xl overflow-hidden group"
                >
                  <Image
                    src={card.image_url}
                    alt={card.title}
                    fill
                    sizes="90vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all"></div>
                  <span title={card.title} className="absolute bottom-2 left-2 bg-white text-black text-sm font-medium rounded-full px-3 py-1 max-w-[90%] truncate z-10 shadow-md">
                    {card.title}
                  </span>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </motion.section>
  );
}