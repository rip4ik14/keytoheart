'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MarqueeCardsProps {
  children?: ReactNode[];
  duration?: number;
}

export default function MarqueeCards({
  children = [],
  duration = 14,
}: MarqueeCardsProps) {
  const MARQUEE_REPEAT = 3;
  const extended = Array(MARQUEE_REPEAT).fill(children).flat();

  const CARD_WIDTH = 320;
  const totalWidth = CARD_WIDTH * (children.length || 0) * MARQUEE_REPEAT;

  if (!children || children.length === 0) {
    return <div />;
  }

  return (
    <motion.div
      className="flex gap-8 md:gap-10 overflow-x-hidden no-scrollbar w-max"
      initial={{ x: 0 }}
      animate={{ x: -totalWidth / 2 }}
      transition={{ repeat: Infinity, duration: duration * MARQUEE_REPEAT, ease: 'linear' }}
      style={{ minWidth: `${totalWidth}px` }}
    >
      {extended.map((child, idx) => (
        <div key={idx}>{child}</div>
      ))}
    </motion.div>
  );
}
