'use client';

import { useEffect, useRef, useState } from 'react';

export default function LazyOnView({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new window.IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShow(true);
            observer && observer.disconnect();
          }
        },
        { rootMargin: '150px' }
      );
      observer.observe(ref.current);
      // Возвращаем функцию очистки для TS
      return () => {
        observer && observer.disconnect();
      };
    } else {
      setShow(true);
    }
    // Возвращаем void, чтобы не было ошибки TS
    return;
  }, []);

  return <div ref={ref}>{show ? children : null}</div>;
}
