'use client';

import { motion } from 'framer-motion';

// Типизация пропсов
interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: string; // Например, 'fadeIn', 'slideInUp'
}

// Определяем варианты анимаций
const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  },
  slideInUp: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  },
  slideInLeft: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  },
  slideInRight: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  },
};

export default function AnimatedSection({ children, animation = 'fadeIn' }: AnimatedSectionProps) {
  // Выбираем вариант анимации или используем fadeIn по умолчанию
  const selectedVariant = animationVariants[animation as keyof typeof animationVariants] || animationVariants.fadeIn;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={selectedVariant}
    >
      {children}
    </motion.div>
  );
}