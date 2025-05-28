'use client';

import { motion } from 'framer-motion';

export default function MarqueeText({
  text = 'Ключик к сердцу Ключик к сердцу Ключик к сердцу ',
  speed = 40,
  className = '',
}: {
  text?: string;
  speed?: number;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden w-full flex items-center bg-transparent select-none pointer-events-none ${className}`}>
      <motion.div
        className="whitespace-nowrap flex font-black uppercase tracking-[-.04em] opacity-[0.13] font-sfpro"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration: speed,
          ease: 'linear',
        }}
        style={{
          willChange: 'transform',
          textShadow: '0 2px 8px rgba(54, 49, 49, 0.66)',
        }}
      >
        <span>{text}</span>
        <span aria-hidden="true" className="ml-12">{text}</span>
      </motion.div>
    </div>
  );
}