'use client';
import dynamic from 'next/dynamic';

const FAQSection = dynamic(() => import('./FAQSection'), { ssr: false });

export default function FAQSectionWrapper() {
  return <FAQSection />;
}
