'use client';
import { motion } from 'framer-motion';

interface MarqueeTextProps {
  text: string;
  fontSize?: string;
  opacity?: string;
  duration?: number;
  direction?: 'left' | 'right';
  className?: string;
  colorClass?: string;
}

export default function MarqueeText({
  text,
  fontSize = "text-[10vw]",
  opacity = "opacity-100",
  duration = 40,
  direction = 'left',
  className = "",
  colorClass = "text-[#ececec]",
}: MarqueeTextProps) {
  const animateArr =
    direction === 'left'
      ? ['0%', '-40%']
      : ['-40%', '0%'];

  return (
    <motion.div
      className={`w-full pointer-events-none absolute ${className}`}
      initial={{ x: 0 }}
      animate={{ x: animateArr }}
      transition={{ repeat: Infinity, duration, ease: "linear" }}
    >
      <span
        className={`
          block font-bold whitespace-nowrap leading-none tracking-tight select-none
          ${fontSize} ${opacity} ${colorClass}
        `}
      >
        {text}
      </span>
    </motion.div>
  );
}
