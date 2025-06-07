'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Динамически загружаем AnimatedSection
const AnimatedSection = dynamic(() => import('@components/AnimatedSection'));

interface ClientAnimatedSectionProps {
  children: ReactNode;
}

export default function ClientAnimatedSection({ children }: ClientAnimatedSectionProps) {
  return <AnimatedSection>{children}</AnimatedSection>;
}