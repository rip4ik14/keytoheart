// ✅ Путь: components/CorporateGallery.tsx
'use client';

import Image from 'next/image';

const images = [
  '/placeholders/case1.jpg',
  '/placeholders/case2.jpg',
  '/placeholders/case3.jpg',
  '/placeholders/case4.jpg',
  '/placeholders/case5.jpg',
  '/placeholders/case6.jpg',
];

export default function CorporateGallery() {
  return (
    <section
      className="py-20 px-4 md:px-8 bg-white text-black"
      aria-labelledby="corporate-gallery-title"
    >
      <h2
        id="corporate-gallery-title"
        className="text-2xl md:text-3xl font-semibold text-center mb-10"
      >
        Примеры наших работ
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {images.map((src, i) => (
          <div
            key={i}
            className="aspect-square overflow-hidden rounded-xl shadow"
            role="img"
            aria-label={`Пример работы ${i + 1}`}
          >
            <Image
              src={src}
              alt={`Пример ${i + 1}`}
              width={600}
              height={600}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              placeholder="blur"
              blurDataURL="/blur-placeholder.png"
              loading="lazy"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>
    </section>
  );
}