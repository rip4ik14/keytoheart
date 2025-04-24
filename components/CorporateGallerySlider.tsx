"use client";

import { useRef } from "react";
import Image from "next/image";

const images = [
  "/placeholders/slider1.jpg",
  "/placeholders/slider2.jpg",
  "/placeholders/slider3.jpg",
  "/placeholders/slider4.jpg",
  "/placeholders/slider5.jpg",
];

export default function CorporateGallerySlider() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  return (
    <section className="relative bg-white py-16 px-4 md:px-8">
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10">
        Корпоративные кейсы
      </h2>

      {/* Стрелки */}
      <button onClick={() => scroll("left")} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 text-white p-2 rounded-full hover:bg-black transition">◀</button>
      <button onClick={() => scroll("right")} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 text-white p-2 rounded-full hover:bg-black transition">▶</button>

      {/* Слайдер */}
      <div ref={scrollRef} className="flex space-x-4 overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory">
        {images.map((src, i) => (
          <div key={i} className="flex-shrink-0 w-[280px] sm:w-[320px] h-[400px] rounded-2xl overflow-hidden snap-start shadow">
            <Image
              src={src}
              alt={`Кейс ${i + 1}`}
              width={320}
              height={400}
              className="w-full h-full object-cover"
              placeholder="blur"
              blurDataURL="/blur-placeholder.png"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
