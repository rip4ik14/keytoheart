'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Динамически загружаем AnimatedSection на стороне клиента
const AnimatedSection = dynamic(() => import('@components/AnimatedSection'), { ssr: false });

interface ClientAnimatedSectionProps {
  children: ReactNode;
}

export default function ClientAnimatedSection({ children }: ClientAnimatedSectionProps) {
  return <AnimatedSection>{children}</AnimatedSection>;
}