'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';
import { ReactNode, MouseEvent } from 'react';

interface TrackedLinkProps {
  href: string;
  children: ReactNode;
  ariaLabel: string;
  category: string;
  action: string;
  label: string;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export default function TrackedLink({
  href,
  children,
  ariaLabel,
  category,
  action,
  label,
  className,
  target,
  rel,
  onClick,
}: TrackedLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    trackEvent({ category, action, label, type: 'link' });
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-block"
    >
      <Link
        href={href}
        className={`${className} focus:outline-none focus:ring-2 focus:ring-black`}
        aria-label={ariaLabel}
        target={target}
        rel={rel}
        role="link"
        onClick={handleClick}
      >
        {children}
      </Link>
    </motion.span>
  );
}