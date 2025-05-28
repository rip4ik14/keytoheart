'use client';

import Link from 'next/link';

export default function BackToOccasionsButton({ occasionTitle }: { occasionTitle: string }) {
  return (
    <Link
      href="/occasions"
      className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-800 transition-all duration-300"
      onClick={() => {
        window.gtag?.('event', 'back_to_occasions', {
          event_category: 'occasion_detail_page',
          event_label: occasionTitle,
        });
        window.ym?.(96644553, 'reachGoal', 'back_to_occasions', {
          occasion: occasionTitle,
        });
      }}
    >
      Посмотреть другие поводы
    </Link>
  );
}