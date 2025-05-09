// ✅ Путь: components/CorporateGallerySlider.tsx
'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface CorporateGallerySliderProps {}

const images = [
  '/images/corporate-gift-1.jpg',
  '/images/corporate-gift-2.jpg',
  '/images/corporate-gift-3.jpg',
  '/images/corporate-gift-4.jpg',
];

export default function CorporateGallerySlider({}: CorporateGallerySliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
      window.gtag?.('event', 'gallery_scroll_left', { event_category: 'corporate' });
      window.ym?.(12345678, 'reachGoal', 'gallery_scroll_left');
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      window.gtag?.('event', 'gallery_scroll_right', { event_category: 'corporate' });
      window.ym?.(12345678, 'reachGoal', 'gallery_scroll_right');
    }
  };

  return (
    <section
      className="py-16 px-4 md:px-8 bg-white text-black"
      aria-labelledby="corporate-gallery-slider-title"
    >
      <motion.h2
        id="corporate-gallery-slider-title"
        className="text-3xl md:text-4xl font-bold text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Примеры наших работ
      </motion.h2>
      <div className="relative max-w-5xl mx-auto">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 scrollbar-hide"
          onScroll={checkScroll}
          role="region"
          aria-label="Галерея примеров работ"
        >
          {images.map((src, index) => (
            <motion.figure
              key={index}
              className="flex-shrink-0 w-80 snap-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Image
                src={src}
                alt={`Корпоративный подарок ${index + 1}`}
                width={320}
                height={320}
                className="rounded-lg object-cover"
                loading="lazy"
                quality={75}
                sizes="320px"
              />
            </motion.figure>
          ))}
        </div>
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-black ${
            canScrollLeft ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
          }`}
          aria-label="Прокрутить галерею влево"
        >
          ←
        </button>
        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-black ${
            canScrollRight ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
          }`}
          aria-label="Прокрутить галерею вправо"
        >
          →
        </button>
      </div>
    </section>
  );
}