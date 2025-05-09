'use client';

import Link from 'next/link';

interface ContactLinkProps {
  href: string;
  label: string;
  type: 'phone' | 'email';
}

export default function ContactLink({ href, label, type }: ContactLinkProps) {
  return (
    <Link
      href={href}
      className="underline hover:text-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-black"
      aria-label={label}
      onClick={() => {
        window.gtag?.('event', `${type}_click`, { event_category: 'policy_page' });
        window.ym?.(12345678, 'reachGoal', `${type}_click`, { page: 'policy' });
      }}
    >
      {href.replace('tel:', '').replace('mailto:', '')}
    </Link>
  );
}