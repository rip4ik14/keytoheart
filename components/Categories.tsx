'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Props {
  title: string;
  imageUrl: string;
  href: string;
}

export default function CategoryCard({ title, imageUrl, href }: Props) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
      onClick={() => {
        window.gtag?.('event', 'category_card_click', {
          event_category: 'navigation',
          category: title,
        });
        window.ym?.(96644553, 'reachGoal', 'category_card_click', {
          category: title,
        });
      }}
    >
      <div className="w-full h-40 bg-gray-100 overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          width={500}
          height={320}
          className="object-cover w-full h-full"
          placeholder="blur"
          blurDataURL="/blur-placeholder.png"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="p-4 text-center">
        <h3 className="text-lg font-semibold text-black">{title}</h3>
      </div>
    </Link>
  );
}