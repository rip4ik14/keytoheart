'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import WebpImage from './WebpImage';

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
      window.ym?.(96644553, 'reachGoal', 'gallery_scroll_left');
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      window.gtag?.('event', 'gallery_scroll_right', { event_category: 'corporate' });
      window.ym?.(96644553, 'reachGoal', 'gallery_scroll_right');
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
              <WebpImage
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
        <motion.button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
            bg-white text-[#535353] transition-all duration-200 shadow-sm
            hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd] ${
              canScrollLeft ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
            }`}
          whileHover={canScrollLeft ? { scale: 1.02 } : {}}
          whileTap={canScrollLeft ? { scale: 0.98 } : {}}
          aria-label="Прокрутить галерею влево"
        >
          ←
        </motion.button>
        <motion.button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
            bg-white text-[#535353] transition-all duration-200 shadow-sm
            hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd] ${
              canScrollRight ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
            }`}
          whileHover={canScrollRight ? { scale: 1.02 } : {}}
          whileTap={canScrollRight ? { scale: 0.98 } : {}}
          aria-label="Прокрутить галерею вправо"
        >
          →
        </motion.button>
      </div>
    </section>
  );
}