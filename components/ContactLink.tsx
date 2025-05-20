'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface ContactLinkProps {
  href: string;
  label: string;
  type: 'email' | 'phone';
  onClick?: () => void;
}

export default function ContactLink({ href, label, type, onClick }: ContactLinkProps) {
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-block"
    >
      <Link
        href={href}
        className="underline hover:text-gray-500 transition-colors duration-300"
        aria-label={label}
        onClick={onClick}
      >
        {type === 'email' ? href.replace('mailto:', '') : href.replace('tel:', '')}
      </Link>
    </motion.span>
  );
}