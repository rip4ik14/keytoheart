'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const FAQSection = dynamic(() => import('./FAQSection'), { ssr: false });

export default function FAQSectionWrapper() {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;

    const node = holderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRender]);

  return <div ref={holderRef}>{shouldRender ? <FAQSection /> : null}</div>;
}
