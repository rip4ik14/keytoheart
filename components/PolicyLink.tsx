'use client';

import Link from 'next/link';

export default function PolicyLink({ page }: { page: string }) {
  return (
    <Link
      href="/policy"
      className="underline hover:text-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-black"
      aria-label="Перейти к политике конфиденциальности"
      onClick={() => {
        window.gtag?.('event', 'policy_click', { event_category: `${page}_page` });
        window.ym?.(12345678, 'reachGoal', 'policy_click', { page });
      }}
    >
      Политике конфиденциальности
    </Link>
  );
}