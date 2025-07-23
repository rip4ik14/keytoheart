'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

export default function AdvantagesClient() {
  const advantages = [
    { icon: '/icons/camera.svg', text: 'Фото букета перед доставкой', alt: 'Camera' },
    { icon: '/icons/truck.svg',  text: 'Доставка от 60 минут',        alt: 'Truck'  },
    { icon: '/icons/dollar-sign.svg', text: 'Кешбэк до 15 %',         alt: 'Dollar' },
  ];

  /* ---------- refs для IntersectionObserver ---------- */
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const [, force] = useState(0); // триггер ререндера для Tailwind‑классов

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('adv-visible');
            io.unobserve(entry.target);
            force((n) => n + 1); // заставляем React вычислить className ещё раз
          }
        }),
      { rootMargin: '-80px 0px' },
    );

    itemsRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section
      className="py-8 md:py-10 bg-white min-h-[200px]"
      aria-label="Преимущества KEY TO HEART"
    >
      <div className="max-w-4xl mx-auto px-2 sm:px-4 grid xs:grid-cols-2 md:grid-cols-3 gap-6">
        {advantages.map((adv, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) itemsRef.current[i] = el;
            }}
            role="listitem"
            className={clsx(
              'flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow h-full',
              'opacity-0 translate-y-6 transition duration-700',
              'hover:shadow-md',
            )}
          >
            <Image
              src={adv.icon}
              alt={adv.alt}
              width={48}
              height={48}
              priority={i === 0}
              className="mb-3"
            />
            <p className="text-lg font-medium text-gray-800 leading-tight">{adv.text}</p>
          </div>
        ))}
      </div>

      {/* минимальный CSS для «появления» */}
      <style>{`
        .adv-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </section>
  );
}
