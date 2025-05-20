'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface PolicyLinkProps {
  page: 'policy' | 'cookies' | 'cookie-policy';
  onClick?: () => void;
}

export default function PolicyLink({ page, onClick }: PolicyLinkProps) {
  const href = page === 'policy' ? '/policy' : '/cookie-policy';
  const label =
    page === 'policy'
      ? 'Политике конфиденциальности'
      : 'Политике использования cookies';

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-block"
    >
      <Link
        href={href}
        className="underline hover:text-gray-500 transition-colors duration-300"
        aria-label={`Перейти к ${label}`}
        onClick={onClick}
      >
        {label}
      </Link>
    </motion.span>
  );
}