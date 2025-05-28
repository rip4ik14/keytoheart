'use client';

import Link from "next/link";
import Image from "next/image";

interface Occasion {
  slug: string;
  title: string;
  image: string;
}

export default function OccasionCard({ occasion, index }: { occasion: Occasion; index: number }) {
  return (
    <Link
      href={`/occasions/${occasion.slug}`}
      className="group block text-center"
      onClick={() => {
        window.gtag?.('event', 'occasion_click', {
          event_category: 'occasions_page',
          event_label: occasion.title,
          value: index + 1,
        });
        window.ym?.(96644553, 'reachGoal', 'occasion_click', {
          occasion: occasion.title,
        });
      }}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <Image
          src={occasion.image}
          alt={occasion.title}
          fill
          className="object-cover transition-transform group-hover:scale-105 duration-300"
        />
      </div>
      <p className="mt-3 text-base sm:text-lg font-medium text-gray-800 group-hover:underline">
        {occasion.title}
      </p>
    </Link>
  );
}