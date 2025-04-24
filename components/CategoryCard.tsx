"use client";

import Link from "next/link";
import Image from "next/image";

const categories = [
  { title: "Цветочные букеты", image: "/images/bukety.jpg", href: "/bukety" },
  { title: "Тюльпаны",        image: "/images/tyulpany.jpg", href: "/tyulpany" },
  { title: "Подарки",         image: "/images/podarki.jpg", href: "/podarki" },
];

export default function Categories() {
  return (
    <section className="py-10 bg-background">
      <h2 className="text-2xl font-bold text-center mb-6">Категории</h2>
      <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4">
        {categories.map((cat) => (
          <Link
            key={cat.title}
            href={cat.href}
            className="group relative block rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
          >
            <Image
              src={cat.image}
              alt={cat.title}
              width={500}
              height={400}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              placeholder="blur"
              blurDataURL="/blur-placeholder.png"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <h3 className="text-white text-xl font-bold">{cat.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
