'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

// Тип для массива изображений
const images: string[] = [
  '/placeholders/case1.jpg',
  '/placeholders/case2.jpg',
  '/placeholders/case3.jpg',
  '/placeholders/case4.jpg',
  '/placeholders/case5.jpg',
  '/placeholders/case6.jpg',
];

// Анимация для элементов галереи
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

export default function CorporateGallery() {
  return (
    <section
      className="py-20 px-4 md:px-8 bg-white text-black"
      aria-labelledby="corporate-gallery-title"
    >
      <motion.h2
        id="corporate-gallery-title"
        className="text-2xl md:text-3xl font-semibold text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Примеры наших работ
      </motion.h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {images.map((src, i) => (
          <motion.div
            key={i}
            className="aspect-square overflow-hidden rounded-xl shadow hover:shadow-md transition-shadow duration-300"
            role="figure"
            aria-label={`Пример корпоративного букета KeyToHeart ${i + 1}`}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            custom={i}
            viewport={{ once: true }}
          >
            <Image
              src={src}
              alt={`Пример корпоративного букета KeyToHeart ${i + 1}`}
              fill
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}