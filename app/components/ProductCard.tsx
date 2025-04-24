"use client";

import Link from "next/link";
import Image from "next/image";

interface Product {
  id: number;
  title: string;
  price: number;
  images?: string[];
}

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => {
          const imageUrl = product.images?.[0] || "/placeholder.jpg";
          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group block bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="relative w-full h-64 bg-gray-100">
                <Image
                  src={imageUrl}
                  alt={product.title}
                  width={500}
                  height={400}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  placeholder="blur"
                  blurDataURL="/blur-placeholder.png"
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {product.title}
                </h3>
                <p className="text-[var(--orange)] font-bold mt-1">
                  {product.price} ₽
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
