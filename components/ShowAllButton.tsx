// components/ShowAllButton.tsx
'use client';

import Link from 'next/link';

export default function ShowAllButton() {
  return (
    <div className="text-center mt-6 mb-12">
      <Link
        href="/catalog"
        className="text-black hover:underline font-medium font-sans uppercase"
        onClick={() => {
          window.gtag?.('event', 'see_all_categories', {
            event_category: 'navigation',
          });
          window.ym?.(96644553, 'reachGoal', 'see_all_categories');
        }}
        aria-label="Посмотреть все категории"
      >
        —ПОКАЗАТЬ ВСЕ—
      </Link>
    </div>
  );
}